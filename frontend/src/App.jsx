import React, { useEffect, useRef, useState } from 'react';
import { socket } from './socket.js';

const LOCAL_KEY_CARS = 'racer:cars';
const LOCAL_KEY_DURATION = 'racer:durationMs';

function randomColor() {
  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function CarIcon({ color = '#3b82f6' }) {
  return (
    <svg
      width="40"
      height="20"
      viewBox="0 0 40 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="carBodyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="4" y="8" width="30" height="7" rx="3" fill="url(#carBodyGradient)" />
      {/* Cabin */}
      <path
        d="M10 8 L18 4 H26 L30 8 Z"
        fill="#e5e7eb"
        fillOpacity="0.8"
      />
      {/* Front spoiler */}
      <rect x="2" y="10" width="4" height="4" rx="1" fill={color} />
      {/* Rear spoiler */}
      <rect x="32" y="7" width="4" height="6" rx="1" fill={color} />
      {/* Wheels */}
      <circle cx="12" cy="16" r="3" fill="#020617" stroke="#64748b" strokeWidth="1" />
      <circle cx="26" cy="16" r="3" fill="#020617" stroke="#64748b" strokeWidth="1" />
      {/* Wheel centers */}
      <circle cx="12" cy="16" r="1" fill="#e5e7eb" />
      <circle cx="26" cy="16" r="1" fill="#e5e7eb" />
    </svg>
  );
}

function App() {
  const [socketConnected, setSocketConnected] = useState(false);
  const [raceDurationMs, setRaceDurationMs] = useState(10000);
  const [cars, setCars] = useState([]);
  const [raceStatus, setRaceStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [progressByCar, setProgressByCar] = useState({});
  const [showRaceModal, setShowRaceModal] = useState(false);

  // Replay state
  const [replayLogs, setReplayLogs] = useState([]);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [replayCars, setReplayCars] = useState([]);
  const [replayResults, setReplayResults] = useState([]);
  const [replayProgressByCar, setReplayProgressByCar] = useState({});
  const [replayMeta, setReplayMeta] = useState(null);
  const replayTimeoutRef = useRef(null);

  const normalizeLogs = (logs) => {
    if (!Array.isArray(logs)) return [];
    return [...logs]
      .sort((a, b) => {
        const ta = typeof a.startedAt === 'number' ? a.startedAt : 0;
        const tb = typeof b.startedAt === 'number' ? b.startedAt : 0;
        return tb - ta; // newest first
      })
      .slice(0, 10);
  };

  const [carName, setCarName] = useState('');
  const [acceleration, setAcceleration] = useState(5);
  const [topSpeed, setTopSpeed] = useState(200);
  const [handling, setHandling] = useState(0.7);

  useEffect(() => {
    try {
      const storedCars = window.localStorage.getItem(LOCAL_KEY_CARS);
      const storedDuration = window.localStorage.getItem(LOCAL_KEY_DURATION);
      if (storedCars) {
        setCars(JSON.parse(storedCars));
      }
      if (storedDuration) {
        setRaceDurationMs(Number(storedDuration));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_KEY_CARS, JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_KEY_DURATION, String(raceDurationMs));
  }, [raceDurationMs]);

  const fetchReplayLogs = async () => {
    try {
      setReplayLoading(true);
      setReplayError(null);
      const res = await fetch('http://localhost:4000/logs');
      if (!res.ok) throw new Error('Failed to load logs');
      const data = await res.json();
      setReplayLogs(normalizeLogs(data.logs));
    } catch (err) {
      setReplayError(err?.message || 'Unable to load logs');
    } finally {
      setReplayLoading(false);
    }
  };

  // Fetch available race logs for replay on mount.
  useEffect(() => {
    fetchReplayLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      setSocketConnected(true);
      setSocketError(null);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleConnectError = (err) => {
      setSocketConnected(false);
      setSocketError(err?.message || 'Unable to connect');
    };

    const handleRaceState = (state) => {
      setRaceStatus(state.status);
      if (Array.isArray(state.cars)) {
        setCars(state.cars);
      }
      if (typeof state.durationMs === 'number') {
        setRaceDurationMs(state.durationMs);
      }
      if (Array.isArray(state.results)) {
        setResults(state.results);
      }
    };

    const handleRaceStarted = ({ startedAt, durationMs }) => {
      setRaceStatus('running');
      // Reset local progress when a new race starts.
      setProgressByCar({});
      const endTime = startedAt + durationMs;
      const updateCountdown = () => {
        const remaining = endTime - Date.now();
        setCountdown(Math.max(0, Math.ceil(remaining / 1000)));
        if (remaining <= 0) {
          clearInterval(interval);
        }
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 250);
    };

    const handleRaceFinished = ({ results: res }) => {
      // Freeze current per-car progress so cars stay where they
      // were at the moment the race ended.
      setProgressByCar((prev) => ({ ...prev }));
      setRaceStatus('finished');
      setResults(res || []);
      setCountdown(0);
      // After a race ends, refresh replay logs so the latest
      // race appears in the Replays list.
      fetchReplayLogs().catch(() => {
        // ignore errors here; UI shows any existing logs
      });
    };

    const handleRaceTick = ({ tick }) => {
      if (!Array.isArray(tick)) return;
      setProgressByCar((prev) => {
        const next = { ...prev };
        tick.forEach((entry) => {
          next[entry.carId] = entry.progress;
        });
        return next;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('race:state', handleRaceState);
    socket.on('race:started', handleRaceStarted);
    socket.on('race:finished', handleRaceFinished);
    socket.on('race:tick', handleRaceTick);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('race:state', handleRaceState);
      socket.off('race:started', handleRaceStarted);
      socket.off('race:finished', handleRaceFinished);
      socket.off('race:tick', handleRaceTick);
    };
  }, []);

  const canAddCar = raceStatus !== 'running';
  const canStartRace = raceStatus !== 'running' && cars.length > 0;

  const handleAddCar = (e) => {
    e.preventDefault();
    if (!carName.trim() || !canAddCar) return;

    const car = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: carName.trim(),
      color: randomColor(),
      attributes: {
        acceleration: Number(acceleration) || 1,
        topSpeed: Number(topSpeed) || 1,
        handling: Math.min(1, Math.max(0, Number(handling) || 0.5)),
      },
    };

    setCars((prev) => [...prev, car]);
    socket.emit('car:add', car);
    setCarName('');
  };

  const handleDurationChange = (value) => {
    const seconds = Number(value) || 0;
    const ms = seconds * 1000;
    setRaceDurationMs(ms);
    socket.emit('race:configure', { durationMs: ms });
  };

  const handleStartRace = () => {
    if (!canStartRace) return;
    setResults([]);
    socket.emit('race:start');
    setShowRaceModal(true);
  };

  const handleResetRace = () => {
    setResults([]);
    setCountdown(null);
    setCars([]);
    setRaceStatus('idle');
    socket.emit('race:reset');
    setShowRaceModal(false);
  };

  const durationSeconds = Math.round(raceDurationMs / 1000);

  const stopReplay = () => {
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
  };

  const startReplay = async (file) => {
    stopReplay();
    try {
      setReplayError(null);
      const res = await fetch(`http://localhost:4000/logs/${encodeURIComponent(file)}`);
      if (!res.ok) throw new Error('Failed to load log');
      const log = await res.json();
      const { cars: logCars = [], ticks = [], results: logResults = [], startedAt, finishedAt, raceId } = log;

      setReplayCars(logCars);
      setReplayResults(Array.isArray(logResults) ? logResults : []);
      setReplayProgressByCar({});
      setReplayMeta({ raceId, startedAt, finishedAt });
      setShowReplayModal(true);

      if (!Array.isArray(ticks) || ticks.length === 0) {
        return;
      }

      // Play back the recorded ticks using their original timing deltas.
      const playStep = (index, prevTime) => {
        if (index >= ticks.length) {
          return;
        }
        const entry = ticks[index];
        const at = typeof entry.at === 'number' ? entry.at : prevTime;
        const delay = index === 0 || !prevTime ? 0 : Math.max(0, at - prevTime);

        replayTimeoutRef.current = setTimeout(() => {
          const tickArray = Array.isArray(entry.tick) ? entry.tick : [];
          if (tickArray.length) {
            setReplayProgressByCar((prev) => {
              const next = { ...prev };
              tickArray.forEach((t) => {
                next[t.carId] = t.progress;
              });
              return next;
            });
          }
          playStep(index + 1, at);
        }, delay);
      };

      playStep(0, ticks[0]?.at ?? 0);
    } catch (err) {
      setReplayError(err?.message || 'Unable to start replay');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-5xl">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Racing Arena</h1>
            <p className="text-sm text-slate-400 mt-1">
              Add as many cars as you like, set a race timer, and let the backend decide the winner.
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              <span>Sample car preview:</span>
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 bg-slate-900/80">
                <CarIcon color="#ef4444" />
                <span className="text-[0.7rem] text-slate-200">If you see this car, SVG is working.</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border text-xs font-medium ${
                socketConnected
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {socketConnected ? 'Connected to backend' : 'Disconnected'}
            </span>
            {socketError && (
              <span className="text-[0.65rem] text-rose-300 max-w-[14rem] truncate">
                {socketError}
              </span>
            )}
          </div>
        </header>

        <main className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
          <section className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Race Setup</h2>
                  <p className="text-xs text-slate-400 mt-1">Configure race duration and add cars.</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="uppercase tracking-wide text-[0.65rem]">Status:</span>
                  <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700/60">
                    {raceStatus === 'idle' && 'Idle'}
                    {raceStatus === 'ready' && 'Ready'}
                    {raceStatus === 'running' && 'Running'}
                    {raceStatus === 'finished' && 'Finished'}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Race duration (seconds)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="600"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 text-slate-50 placeholder:text-slate-500"
                      value={durationSeconds}
                      onChange={(e) => handleDurationChange(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">sec</span>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleStartRace}
                    disabled={!canStartRace}
                    className={`inline-flex justify-center items-center rounded-lg px-4 py-2.5 text-sm font-medium shadow-md shadow-emerald-500/25 transition-all border border-emerald-500/70 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
                  >
                    Start race
                  </button>
                  <button
                    type="button"
                    onClick={handleResetRace}
                    className="inline-flex justify-center items-center rounded-lg px-4 py-2 text-xs font-medium border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRaceModal(true)}
                    disabled={!cars.length}
                    className="inline-flex justify-center items-center rounded-lg px-4 py-2 text-xs font-medium border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    View live race
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddCar} className="mt-4 border-t border-slate-800 pt-4 grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Car name</label>
                  <input
                    type="text"
                    required
                    disabled={!canAddCar}
                    placeholder="e.g. Thunderbolt GT"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50 placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Acceleration</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50"
                      value={acceleration}
                      onChange={(e) => setAcceleration(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Top speed</label>
                    <input
                      type="number"
                      min="80"
                      max="400"
                      step="5"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50"
                      value={topSpeed}
                      onChange={(e) => setTopSpeed(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Handling</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50"
                      value={handling}
                      onChange={(e) => setHandling(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!canAddCar}
                    className="inline-flex justify-center items-center rounded-lg px-4 py-2 text-sm font-medium border border-sky-500/70 bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Add car
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Garage ({cars.length})</h2>
                <p className="text-xs text-slate-400">Any number of cars can join.</p>
              </div>
              {cars.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No cars added yet. Use the form above to add your first racer.
                </p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                  {cars.map((car) => (
                    <li
                      key={car.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-8 rounded-full"
                          style={{ backgroundColor: car.color }}
                        />
                        <div>
                          <div className="font-semibold text-slate-100 text-sm">
                            {car.name}
                          </div>
                          <div className="text-[0.7rem] text-slate-400 flex gap-3">
                            <span>Acc: {car.attributes.acceleration.toFixed(1)}</span>
                            <span>Top: {car.attributes.topSpeed.toFixed(0)}</span>
                            <span>Handling: {car.attributes.handling.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Race monitor</h2>
                <div className="text-xs text-slate-400 flex gap-3">
                  <span>
                    Timer:{' '}
                    <span className="font-semibold text-slate-100">
                      {countdown !== null ? `${countdown}s` : `${durationSeconds}s`}
                    </span>
                  </span>
                  <span>
                    Cars:{' '}
                    <span className="font-semibold text-slate-100">{cars.length}</span>
                  </span>
                </div>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-3 py-3 space-y-2">
                <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-widest text-slate-500 mb-1">
                  <span>Grid</span>
                  <span>Track</span>
                  <span>Finish</span>
                </div>
                {cars.slice(0, 6).map((car) => {
                  const totalSeconds = durationSeconds || 1;
                  const timeFactor = raceStatus === 'finished'
                    ? 1
                    : countdown !== null
                    ? 1 - Math.max(0, countdown) / totalSeconds
                    : 0;
                  const tickProgress = progressByCar[car.id];
                  const base = Math.max(0, Math.min(1, timeFactor));
                  const progress = typeof tickProgress === 'number'
                    ? Math.max(0, Math.min(1, tickProgress))
                    : base;
                  const posPct = 4 + Math.max(0, Math.min(1, progress)) * 88; // keep car within lane
                  const pctLabel = Math.round(progress * 100);

                  return (
                    <div
                      key={car.id}
                      className="relative h-12 rounded-full bg-slate-900/80 border border-slate-800 overflow-hidden flex items-center"
                    >
                      <div className="absolute inset-y-6 left-4 right-4 border-b border-dashed border-slate-700/70 opacity-60" />
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: `${posPct}%`,
                          transform: 'translate(-50%, -50%)',
                          transition: 'left 0.2s linear',
                        }}
                      >
                        <CarIcon color={car.color} />
                      </div>
                      <div className="relative z-10 flex w-full items-center justify-between px-3 text-[0.7rem]">
                        <span className="truncate text-slate-200 max-w-[7rem]">{car.name}</span>
                        <span className="w-10 text-right text-[0.65rem] text-slate-400">{pctLabel}%</span>
                      </div>
                    </div>
                  );
                })}
                {cars.length === 0 && (
                  <p className="text-xs text-slate-500">No cars in this race yet.</p>
                )}
                {cars.length > 6 && (
                  <div className="text-[0.65rem] text-slate-500 mt-1">
                    + {cars.length - 6} more cars
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Results</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <p>Computed entirely on the backend.</p>
                  <button
                    type="button"
                    onClick={() => {
                      // refresh logs on demand
                      fetchReplayLogs();
                    }}
                    className="border border-slate-700 rounded px-2 py-1 text-[0.65rem] bg-slate-900/70 hover:bg-slate-800/80"
                  >
                    Refresh replays
                  </button>
                </div>
              </div>
              {raceStatus !== 'finished' ? (
                <p className="text-sm text-slate-500">
                  Once the race finishes, results will appear here.
                </p>
              ) : results && results.length > 0 ? (
                <ol className="space-y-2 text-sm">
                  {results.map((r) => {
                    const car = cars.find((c) => c.id === r.carId);
                    const timeSec =
                      typeof r.finishTimeMs === 'number'
                        ? (r.finishTimeMs / 1000).toFixed(2)
                        : null;
                    return (
                      <li
                        key={r.carId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-semibold text-amber-300">
                            #{r.rank}
                          </span>
                          <div
                            className="w-2 h-8 rounded-full"
                            style={{ backgroundColor: car?.color || '#64748b' }}
                          />
                          <div>
                            <div className="font-semibold text-slate-100 text-sm">{r.name}</div>
                            <div className="text-[0.7rem] text-slate-400">
                              Final speed: {r.finalSpeed.toFixed(1)}
                            </div>
                            {timeSec && (
                              <div className="text-[0.7rem] text-slate-400">
                                Time: {timeSec}s
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">No results available.</p>
              )}
              <div className="mt-4 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Replays</h3>
                  {replayLoading && (
                    <span className="text-[0.65rem] text-slate-500">Loading...</span>
                  )}
                </div>
                {replayError && (
                  <p className="text-[0.7rem] text-rose-300 mb-1">{replayError}</p>
                )}
                {replayLogs && replayLogs.length > 0 ? (
                  <ul className="space-y-1 max-h-32 overflow-auto pr-1 text-[0.7rem]">
                    {replayLogs.map((log) => (
                      <li
                        key={log.file}
                        className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/70 px-2 py-1"
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-200 truncate max-w-[10rem]">{log.raceId}</span>
                          {log.startedAt && (
                            <span className="text-slate-500">
                              {new Date(log.startedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => startReplay(log.file)}
                          className="text-[0.65rem] px-2 py-1 rounded border border-sky-500/70 text-sky-300 hover:bg-sky-500/10"
                        >
                          View replay
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[0.7rem] text-slate-500">No recorded races yet.</p>
                )}
              </div>
            </div>
          </section>
        </main>
        {showRaceModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15,23,42,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-950/70">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Live race</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualizing the current race using a simple ASCII track.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRaceModal(false)}
                  className="text-xs px-3 py-1 rounded-lg border border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 text-slate-300"
                >
                  Close
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>
                  Timer:{' '}
                  <span className="font-semibold text-slate-100">
                    {countdown !== null ? `${countdown}s` : `${durationSeconds}s`}
                  </span>
                </span>
                <span>
                  Cars:{' '}
                  <span className="font-semibold text-slate-100">{cars.length}</span>
                </span>
                <span>
                  Status:{' '}
                  <span className="font-semibold text-slate-100">{raceStatus}</span>
                </span>
              </div>
              <div className="border border-slate-800 rounded-xl px-3 py-3 bg-slate-950/60 max-h-64 overflow-auto mb-3 space-y-1">
                {cars.length === 0 ? (
                  <p className="text-xs text-slate-500">No cars in this race yet.</p>
                ) : (
                  <>
                    {cars.slice(0, 12).map((car) => {
                      const totalSeconds = durationSeconds || 1;
                      const timeFactor = raceStatus === 'finished'
                        ? 1
                        : countdown !== null
                        ? 1 - Math.max(0, countdown) / totalSeconds
                        : 0;
                      const tickProgress = progressByCar[car.id];
                      const base = Math.max(0, Math.min(1, timeFactor));
                      const progress = typeof tickProgress === 'number'
                        ? Math.max(0, Math.min(1, tickProgress))
                        : base;
                      const posPct = 4 + Math.max(0, Math.min(1, progress)) * 88;
                      const pctLabel = Math.round(progress * 100);

                      return (
                        <div
                          key={car.id}
                          className="relative h-12 rounded-full bg-slate-900/80 border border-slate-800 overflow-hidden mb-1 last:mb-0 flex items-center"
                        >
                          <div className="absolute inset-y-6 left-4 right-4 border-b border-dashed border-slate-700/70 opacity-60" />
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: `${posPct}%`,
                              transform: 'translate(-50%, -50%)',
                              transition: 'left 0.2s linear',
                            }}
                          >
                            <CarIcon color={car.color} />
                          </div>
                          <div className="relative z-10 flex w-full items-center justify-between px-3 text-[0.7rem]">
                            <span className="truncate text-slate-200 max-w-[7rem]">{car.name}</span>
                            <span className="w-10 text-right text-[0.65rem] text-slate-400">{pctLabel}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {cars.length > 12 && (
                      <div className="text-[0.65rem] text-slate-500 mt-1">
                        + {cars.length - 12} more cars
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="mt-2 border-t border-slate-800 pt-3">
                <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-widest">Winners</h3>
                {raceStatus === 'finished' && results && results.length > 0 ? (
                  <ol className="space-y-1 text-xs">
                    {results.slice(0, 3).map((r) => {
                      const car = cars.find((c) => c.id === r.carId);
                      const timeSec =
                        typeof r.finishTimeMs === 'number'
                          ? (r.finishTimeMs / 1000).toFixed(2)
                          : null;
                      return (
                        <li key={r.carId} className="flex items-center gap-2">
                          <span className="w-6 text-center font-semibold text-amber-300">#{r.rank}</span>
                          <span
                            className="w-2 h-4 rounded-full"
                            style={{ backgroundColor: car?.color || '#64748b' }}
                          />
                          <span className="truncate text-slate-100 max-w-[10rem]">{r.name}</span>
                          <span className="text-[0.65rem] text-slate-400 ml-auto">
                            {r.finalSpeed.toFixed(1)}
                            {timeSec && ` · ${timeSec}s`}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-[0.7rem] text-slate-500">
                    Winners will appear here when the race finishes.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {showReplayModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15,23,42,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 40,
            }}
          >
            <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-950/70">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Race replay</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Playing back a recorded race exactly as it happened.
                  </p>
                  {replayMeta && (
                    <p className="text-[0.65rem] text-slate-500 mt-1">
                      {replayMeta.raceId && <span className="mr-2">{replayMeta.raceId}</span>}
                      {replayMeta.startedAt && (
                        <span>
                          {new Date(replayMeta.startedAt).toLocaleTimeString()} -{' '}
                          {replayMeta.finishedAt && new Date(replayMeta.finishedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopReplay();
                    setShowReplayModal(false);
                  }}
                  className="text-xs px-3 py-1 rounded-lg border border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 text-slate-300"
                >
                  Close
                </button>
              </div>
              <div className="border border-slate-800 rounded-xl px-3 py-3 bg-slate-950/60 max-h-64 overflow-auto mb-3 space-y-1">
                {replayCars.length === 0 ? (
                  <p className="text-xs text-slate-500">No cars in this replay.</p>
                ) : (
                  <>
                    {replayCars.slice(0, 12).map((car) => {
                      const progressRaw = replayProgressByCar[car.id] ?? 0;
                      const progress = Math.max(0, Math.min(1, progressRaw));
                      const posPct = 4 + progress * 88;
                      const pctLabel = Math.round(progress * 100);

                      return (
                        <div
                          key={car.id}
                          className="relative h-12 rounded-full bg-slate-900/80 border border-slate-800 overflow-hidden mb-1 last:mb-0 flex items-center"
                        >
                          <div className="absolute inset-y-6 left-4 right-4 border-b border-dashed border-slate-700/70 opacity-60" />
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: `${posPct}%`,
                              transform: 'translate(-50%, -50%)',
                              transition: 'left 0.2s linear',
                            }}
                          >
                            <CarIcon color={car.color} />
                          </div>
                          <div className="relative z-10 flex w-full items-center justify-between px-3 text-[0.7rem]">
                            <span className="truncate text-slate-200 max-w-[7rem]">{car.name}</span>
                            <span className="w-10 text-right text-[0.65rem] text-slate-400">{pctLabel}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {replayCars.length > 12 && (
                      <div className="text-[0.65rem] text-slate-500 mt-1">
                        + {replayCars.length - 12} more cars
                      </div>
                    )}
                  </>
                )}
              </div>
              {replayResults && replayResults.length > 0 && (
                <div className="mt-2 border-t border-slate-800 pt-3">
                  <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-widest">Results</h3>
                  <ol className="space-y-1 text-xs">
                    {replayResults.map((r) => {
                      const car = replayCars.find((c) => c.id === r.carId);
                      const timeSec =
                        typeof r.finishTimeMs === 'number'
                          ? (r.finishTimeMs / 1000).toFixed(2)
                          : null;
                      return (
                        <li key={r.carId} className="flex items-center gap-2">
                          <span className="w-6 text-center font-semibold text-amber-300">#{r.rank}</span>
                          <span
                            className="w-2 h-4 rounded-full"
                            style={{ backgroundColor: car?.color || '#64748b' }}
                          />
                          <span className="truncate text-slate-100 max-w-[10rem]">{r.name}</span>
                          <span className="text-[0.65rem] text-slate-400 ml-auto">
                            {r.finalSpeed.toFixed(1)}
                            {timeSec && ` · ${timeSec}s`}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
