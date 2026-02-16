/**
 * Base stats for a car used to derive its overall performance.
 * All values are positive; handling is expected to be in the [0, 1] range.
 */
export type CarAttributes = {
  /** Higher values make the car accelerate faster. */
  acceleration: number;
  /** Maximum speed for the car (arbitrary units, treated as relative). */
  topSpeed: number;
  /**
   * Handling factor in the range [0, 1].
   * Higher values reduce randomness and make the car more stable.
   */
  handling: number;
};

/**
 * A single car participating in the race.
 */
export type Car = {
  id: string;
  name: string;
  color: string;
  attributes: CarAttributes;
  /** Optional owner information when cars come from a registered user. */
  ownerUserId?: string;
  ownerName?: string;
};

/**
 * High-level lifecycle status of the race.
 */
export type RaceStatus = 'idle' | 'ready' | 'running' | 'finished';

/**
 * Final result entry for a single car once the race has completed.
 */
export type RaceResult = {
  carId: string;
  name: string;
  color: string;
  /** Aggregate performance score used for ranking if times are equal. */
  finalSpeed: number;
  /** 1-based finishing position in the race. */
  rank: number;
  /**
   * Time (in milliseconds) it took this car to finish,
   * measured from when the race started.
   */
  finishTimeMs: number;
};
/**
 * Snapshot of the overall race state, suitable for emission over Socket.IO.
 */
export type RaceState = {
  cars: Car[];
  durationMs: number;
  status: RaceStatus;
  startedAt?: number;
  finishedAt?: number;
  results?: RaceResult[];
  /** Optional identifier for the current race, used for logging/replay. */
  raceId?: string;
};

/**
 * Per-tick progress update for a single car.
 * `progress` is a normalized value from 0 (start line) to 1 (finish line).
 */
export type RaceTick = {
  carId: string;
  name: string;
  color: string;
  progress: number; // 0 - 1
};
import * as fs from 'fs';
import * as path from 'path';

export class RaceManager {
  private state: RaceState = {
    cars: [],
    durationMs: 10000,
    status: 'idle',
  };

  private tickTimer: NodeJS.Timeout | null = null;
  private performance: Map<
    string,
    {
      name: string;
      color: string;
      /** Aggregate performance score for the car. */
      speedScore: number;
      /** Stability factor derived from handling, in [0.5, 1]. */
      stability: number;
      /** Normalized acceleration factor in [0.1, 1]. */
      accelFactor: number;
      /** Normalized top-speed factor in [0.4, 1]. */
      topSpeedFactor: number;
    }
  > = new Map();
  private progress: Map<string, number> = new Map();
  private finishTimes: Map<string, number> = new Map();
  /** Per-car current speed used to integrate distance over time. */
  private speeds: Map<string, number> = new Map();
  /** Sequential counter for assigning race IDs. */
  private raceCounter = 0;
  /** Identifier for the currently running race, if any. */
  private currentRaceId: string | null = null;
  /** Tick history captured for replay/logging. */
  private tickHistory: { at: number; tick: RaceTick[] }[] = [];
  /** External lobby ID (UUID) so logs can be tied back to /race/:id. */
  private lobbyId: string | null = null;

  /** Associate this manager with a specific lobby UUID. */
  setLobbyId(id: string) {
    this.lobbyId = id;
  }

  /**
   * Returns the current in-memory race state.
   *
   * This is a live view that reflects the latest configuration
   * and progression of the race.
   */
  getState(): RaceState {
    return this.state;
  }

  /**
   * Configure the race duration in milliseconds.
   *
   * If the race is currently idle, this will move it to the `ready` state.
   */
  configure(durationMs: number) {
    this.state.durationMs = durationMs;
    if (this.state.status === 'idle') {
      this.state.status = 'ready';
    }
  }

  /**
   * Add a car to the race lobby.
   *
   * Cars can only be added while the race is not running.
   * Adding the first car when idle will move the race to `ready`.
   */
  addCar(car: Car) {
    if (this.state.status === 'running') {
      return;
    }
    this.state.cars = [...this.state.cars, car];
    if (this.state.status === 'idle') {
      this.state.status = 'ready';
    }
  }

  /**
   * Reset the race back to an idle state.
   *
   * Clears all cars, timers, performance data, and results,
   * but preserves the configured duration for convenience.
   */
  clear() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.performance.clear();
    this.progress.clear();
    this.finishTimes.clear();
    this.speeds.clear();
    this.tickHistory = [];
    this.currentRaceId = null;
    this.state = {
      cars: [],
      durationMs: this.state.durationMs,
      status: 'idle',
    };
  }

  /**
   * Start the race simulation.
   *
   * - Precomputes a performance score for each car.
   * - Starts a fixed-interval tick that advances per-car progress.
   * - Records per-car finish times when they first reach 100% progress.
   * - Stops only after **all** cars have finished, then computes results
   *   and invokes `onFinished`.
   *
   * @param onTick Callback invoked roughly every 200ms with per-car progress.
   * @param onFinished Callback invoked once when all cars have finished.
   * @returns `true` if the race was successfully started, `false` otherwise.
   */
  start(
    onTick: (tick: RaceTick[]) => void,
    onFinished: (results: RaceResult[], state: RaceState) => void,
  ): boolean {
    if (this.state.status === 'running' || this.state.cars.length === 0) {
      return false;
    }

    this.state.status = 'running';
    this.state.startedAt = Date.now();

    const duration = this.state.durationMs;
    const startedAt = this.state.startedAt;

    // Assign a race ID for logging/replay purposes.
    this.raceCounter += 1;
    this.currentRaceId = `race-${Date.now()}-${this.raceCounter}`;
    this.state.raceId = this.currentRaceId;

    // Precompute a performance score per car; this now has only a
    // light influence on speed so that even fully "maxed" cars can lose.
    this.performance.clear();
    this.progress.clear();
    this.finishTimes.clear();
    this.speeds.clear();

    // Determine a normalization factor for top speed so that cars with
    // higher topSpeed can sustain higher velocities.
    let maxTopSpeed = 0;
    for (const car of this.state.cars) {
      if (car.attributes.topSpeed > maxTopSpeed) {
        maxTopSpeed = car.attributes.topSpeed;
      }
    }

    let maxScore = 0;
    for (const car of this.state.cars) {
      const { acceleration, topSpeed, handling } = car.attributes;
      const randomFactor = 0.9 + Math.random() * 0.3; // 0.9 - 1.2
      const stability = 0.5 + handling * 0.5; // 0.5 - 1
      const base = acceleration * 0.6 + topSpeed * 0.4;
      const score = base * randomFactor * stability;

      const accelFactor = Math.max(0.1, Math.min(1, acceleration / 10));
      const topSpeedFactor =
        maxTopSpeed > 0
          ? Math.min(1, Math.max(0.4, topSpeed / maxTopSpeed))
          : 1;

      this.performance.set(car.id, {
        name: car.name,
        color: car.color,
        speedScore: score,
        stability,
        accelFactor,
        topSpeedFactor,
      });
      this.progress.set(car.id, 0);
      this.speeds.set(car.id, 0);
      if (score > maxScore) maxScore = score;
    }
    // Each tick advances cars forward based on a mostly random
    // normalized speed, with only a slight bias from stats.
    const baseIncrement = Math.max(0.005, 200 / duration); // scaled by configured duration

    this.tickTimer = setInterval(() => {
      if (maxScore === 0 || this.state.cars.length === 0) {
        return;
      }

      const ticks: RaceTick[] = [];
      let allFinished = true;

      for (const car of this.state.cars) {
        const perf = this.performance.get(car.id);
        if (!perf) continue;
        const statComponent = maxScore > 0 ? perf.speedScore / maxScore : 0.5;
        const currentProgress = this.progress.get(car.id) ?? 0;
        const currentSpeed = this.speeds.get(car.id) ?? 0;

        // Large random component so that outcomes are not dominated
        // by base stats. Stats only nudge this value slightly.
        const randomComponent = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
        const baseNormalizedSpeed =
          0.8 * randomComponent + 0.2 * statComponent; // stats have ~20% weight

        // Cars with worse handling see a bit more volatility, but the
        // effect is modest so no single stat can guarantee a win.
        const volatility = (1 - perf.stability) * 0.2; // softer than before
        const jitter = (Math.random() - 0.5) * volatility;

        // Target speed is based mostly on randomness, gently biased by
        // stats and scaled a little by topSpeedFactor.
        const targetSpeedRaw = baseNormalizedSpeed * (1 + jitter);
        const targetSpeed = Math.max(
          0,
          targetSpeedRaw * (0.8 + 0.2 * perf.topSpeedFactor),
        );

        // Acceleration still matters but only slightly: higher
        // acceleration lets a car adapt its speed a bit faster.
        const accelUp = 0.03 + 0.05 * perf.accelFactor;
        const decelDown = 0.04 + 0.06 * (1 - perf.stability);

        const diff = targetSpeed - currentSpeed;
        let deltaSpeed: number;
        if (diff > 0) {
          deltaSpeed = Math.min(diff, accelUp);
        } else {
          deltaSpeed = Math.max(diff, -decelDown);
        }

        const newSpeed = Math.max(0, currentSpeed + deltaSpeed);
        this.speeds.set(car.id, newSpeed);

        const increment = newSpeed * baseIncrement;
        const next = Math.min(1, currentProgress + increment);
        this.progress.set(car.id, next);
        if (next >= 1 && startedAt && !this.finishTimes.has(car.id)) {
          this.finishTimes.set(car.id, Date.now() - startedAt);
        }
        if (next < 1) {
          allFinished = false;
        }
        ticks.push({
          carId: car.id,
          name: car.name,
          color: car.color,
          progress: next,
        });
      }

      if (ticks.length) {
        // Capture tick history with timestamps for later replay.
        this.tickHistory.push({ at: Date.now(), tick: ticks });
        onTick(ticks);
      }

      if (allFinished) {
        if (this.tickTimer) {
          clearInterval(this.tickTimer);
          this.tickTimer = null;
        }
        const results = this.computeResults();
        this.state.status = 'finished';
        this.state.finishedAt = Date.now();
        this.state.results = results;
        this.persistRaceLog(results);
        onFinished(results, this.state);
      }
    }, 200);

    return true;
  }

  /**
   * Compute the final results array for all cars.
   *
   * Uses the precomputed performance scores when available to keep
   * rankings consistent with the visual progression, but ranks
   * primarily by `finishTimeMs` (fastest time wins).
   */
  private computeResults(): RaceResult[] {
    // Use the precomputed performance scores if available to keep
    // overall performance consistent with the visual race progression,
    // but rank primarily by finish time.
    let scored: {
      carId: string;
      name: string;
      color: string;
      finalSpeed: number;
      finishTimeMs: number;
    }[];
    if (this.performance.size) {
      scored = this.state.cars.map((car) => {
        const perf = this.performance.get(car.id);
        const finalSpeed = perf?.speedScore ?? 0;
        const finishTimeMs = this.finishTimes.get(car.id) ?? Number.MAX_SAFE_INTEGER;
        return {
          carId: car.id,
          name: car.name,
          color: car.color,
          finalSpeed,
          finishTimeMs,
        };
      });
    } else {
      scored = this.state.cars.map((car) => {
        const { acceleration, topSpeed, handling } = car.attributes;
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
        const stability = 0.5 + handling * 0.5; // 0.5 - 1
        const rawSpeed = acceleration * 0.6 + topSpeed * 0.4;
        const finalSpeed = rawSpeed * randomFactor * stability;
        const finishTimeMs = this.finishTimes.get(car.id) ?? Number.MAX_SAFE_INTEGER;
        return {
          carId: car.id,
          name: car.name,
          color: car.color,
          finalSpeed,
          finishTimeMs,
        };
      });
    }

    const sorted = scored
      .sort((a, b) => {
        if (a.finishTimeMs !== b.finishTimeMs) {
          return a.finishTimeMs - b.finishTimeMs;
        }
        return b.finalSpeed - a.finalSpeed;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return sorted;
  }

  /**
   * Persist a full log of the just-finished race to disk so that
   * it can be inspected or replayed later.
   */
  private persistRaceLog(results: RaceResult[]): void {
    if (!this.currentRaceId || !this.state.startedAt || !this.state.finishedAt) {
      return;
    }

    const logDir = path.join(__dirname, '..', 'logs');
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch {
      // best-effort only
    }

    // Prefer using the external lobby UUID for the filename so
    // logs line up naturally with /race/:id URLs. Fall back to
    // the internal raceId for backward compatibility.
    const fileNameBase = this.lobbyId || this.currentRaceId;
    if (!fileNameBase) {
      return;
    }
    const filePath = path.join(logDir, `${fileNameBase}.json`);
    const payload = {
      raceId: this.currentRaceId,
      lobbyId: this.lobbyId,
      startedAt: this.state.startedAt,
      finishedAt: this.state.finishedAt,
      durationMs: this.state.durationMs,
      cars: this.state.cars,
      ticks: this.tickHistory,
      results,
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {
      // If logging fails we don't want to break the race.
    }
  }
}
