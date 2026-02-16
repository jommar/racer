import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';
import RaceSetupAndGarage from './RaceSetupAndGarage.jsx';
import RaceMonitorAndResults from './RaceMonitorAndResults.jsx';
import RaceModal from './RaceModal.jsx';
import ReplayModal from './ReplayModal.jsx';

const LOCAL_KEY_CARS = 'racer:cars';
const LOCAL_KEY_DURATION = 'racer:durationMs';
const LOCAL_KEY_RACE_ID = 'racer:raceId';
const LOCAL_KEY_OPEN_MODAL_ON_LOAD = 'racer:openRaceModalOnce';
const LOCAL_KEY_OPEN_REPLAY_FOR_RACE = 'racer:openReplayForRace';

function randomColor() {
  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function normalizeLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return [...logs]
    .sort((a, b) => {
      const ta = typeof a.startedAt === 'number' ? a.startedAt : 0;
      const tb = typeof b.startedAt === 'number' ? b.startedAt : 0;
      return tb - ta; // newest first
    })
    .slice(0, 10);
}

function RaceView({ onSocketStatusChange, renderMain = true, viewRequest = null, readOnly = false, user }) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);

  const [raceDurationMs, setRaceDurationMs] = useState(10000);
  const [cars, setCars] = useState([]);
  const [raceStatus, setRaceStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [progressByCar, setProgressByCar] = useState({});
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [raceId, setRaceId] = useState('');

  const [replayLogs, setReplayLogs] = useState([]);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [replayCars, setReplayCars] = useState([]);
  const [replayResults, setReplayResults] = useState([]);
  const [replayProgressByCar, setReplayProgressByCar] = useState({});
  const [replayMeta, setReplayMeta] = useState(null);
  const replayTimeoutRef = useRef(null);
  const [pendingReplayRaceId, setPendingReplayRaceId] = useState(null);
  const [raceError, setRaceError] = useState(null);
  const [autoReplayStarted, setAutoReplayStarted] = useState(false);

  const [carName, setCarName] = useState('');
  const [acceleration, setAcceleration] = useState(5);
  const [topSpeed, setTopSpeed] = useState(200);
  const [handling, setHandling] = useState(0.7);

  // Logged-in user's garage cars (for registering into a race when
  // viewing /race/:id as a regular user).
  const [userCars, setUserCars] = useState([]);
  const [userCarsLoading, setUserCarsLoading] = useState(false);
  const [userCarsError, setUserCarsError] = useState(null);
  const [selectedUserCarId, setSelectedUserCarId] = useState('');
  const [registeringUserCar, setRegisteringUserCar] = useState(false);
  const [registerUserCarMessage, setRegisterUserCarMessage] = useState(null);

  // All cars (admin view) for registering any car into a race.
  const [adminCars, setAdminCars] = useState([]);
  const [adminCarsLoading, setAdminCarsLoading] = useState(false);
  const [adminCarsError, setAdminCarsError] = useState(null);
  const [selectedAdminCarId, setSelectedAdminCarId] = useState('');
  const [registeringAdminCar, setRegisteringAdminCar] = useState(false);
  const [registerAdminCarMessage, setRegisterAdminCarMessage] = useState(null);

  // Load stored race state on mount (editable mode only).
  // In read-only mode (e.g. /race/:id), derive raceId from the URL
  // and avoid touching localStorage so the viewer stays stateless.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (readOnly) {
      const path = window.location.pathname || '';
      const match = path.match(/\/race\/([^/]+)/);
      if (match && match[1]) {
        try {
          setRaceId(decodeURIComponent(match[1]));
        } catch {
          setRaceId(match[1]);
        }
      }
      return;
    }

    try {
      const storedCars = window.localStorage.getItem(LOCAL_KEY_CARS);
      const storedDuration = window.localStorage.getItem(LOCAL_KEY_DURATION);
      const storedRaceId = window.localStorage.getItem(LOCAL_KEY_RACE_ID);
      const shouldOpenModal = window.localStorage.getItem(LOCAL_KEY_OPEN_MODAL_ON_LOAD);
      const replayRaceId = window.localStorage.getItem(LOCAL_KEY_OPEN_REPLAY_FOR_RACE);
      if (storedCars) {
        setCars(JSON.parse(storedCars));
      }
      if (storedDuration) {
        setRaceDurationMs(Number(storedDuration));
      }
      if (storedRaceId) {
        setRaceId(storedRaceId);
      }
      if (shouldOpenModal === '1') {
        setShowRaceModal(true);
        window.localStorage.removeItem(LOCAL_KEY_OPEN_MODAL_ON_LOAD);
      }
      if (replayRaceId) {
        setPendingReplayRaceId(replayRaceId);
        window.localStorage.removeItem(LOCAL_KEY_OPEN_REPLAY_FOR_RACE);
      }
    } catch {
      // ignore
    }
  }, [readOnly]);

  // When viewing a race page as a regular user, load their garage cars
  // so they can register one into the current race.
  useEffect(() => {
    if (!readOnly) return;
    if (!user || !user.id) return;

    const fetchUserCars = async () => {
      try {
        setUserCarsLoading(true);
        setUserCarsError(null);
        const res = await fetch(`http://localhost:4000/user/${encodeURIComponent(user.id)}/cars`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load your cars');
        const data = await res.json();
        setUserCars(Array.isArray(data.cars) ? data.cars : []);
      } catch (err) {
        setUserCarsError(err?.message || 'Unable to load your cars');
      } finally {
        setUserCarsLoading(false);
      }
    };

    fetchUserCars();
  }, [readOnly, user && user.id]);

  // When viewing a race page as an admin, load all cars so they can
  // register any car into the current race.
  useEffect(() => {
    if (!readOnly) return;
    if (!user || user.role !== 'admin') return;

    const fetchAdminCars = async () => {
      try {
        setAdminCarsLoading(true);
        setAdminCarsError(null);
        const res = await fetch('http://localhost:4000/admin/cars', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load cars');
        const data = await res.json();
        setAdminCars(Array.isArray(data.cars) ? data.cars : []);
      } catch (err) {
        setAdminCarsError(err?.message || 'Unable to load cars');
      } finally {
        setAdminCarsLoading(false);
      }
    };

    fetchAdminCars();
  }, [readOnly, user && user.role]);

  // Persist race state in editable mode only.
  useEffect(() => {
    if (typeof window === 'undefined' || readOnly) return;
    window.localStorage.setItem(LOCAL_KEY_CARS, JSON.stringify(cars));
  }, [cars, readOnly]);

  useEffect(() => {
    if (typeof window === 'undefined' || readOnly) return;
    window.localStorage.setItem(LOCAL_KEY_DURATION, String(raceDurationMs));
  }, [raceDurationMs, readOnly]);

  useEffect(() => {
    if (typeof window === 'undefined' || readOnly) return;
    if (raceId) {
      window.localStorage.setItem(LOCAL_KEY_RACE_ID, raceId);
    } else {
      window.localStorage.removeItem(LOCAL_KEY_RACE_ID);
    }
  }, [raceId, readOnly]);

  const reportSocketStatus = (connected, error) => {
    setSocketConnected(connected);
    setSocketError(error || null);
    if (onSocketStatusChange) {
      onSocketStatusChange(connected, error || null);
    }
  };

  // Socket wiring for race events
  useEffect(() => {
    const handleConnect = () => {
      reportSocketStatus(true, null);
      if (raceId) {
        socket.emit('race:join', { raceId });
      }
    };

    const handleDisconnect = () => {
      reportSocketStatus(false, socketError);
    };

    const handleConnectError = (err) => {
      reportSocketStatus(false, err?.message || 'Unable to connect');
    };

    const handleRaceState = (state) => {
      if (state.raceId && !raceId) {
        setRaceId(state.raceId);
      }
      if (state.raceId && raceId && state.raceId !== raceId) {
        return;
      }
      setRaceError(null);
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

    const handleRaceStarted = ({ startedAt, durationMs, raceId: startedRaceId }) => {
      if (startedRaceId && raceId && startedRaceId !== raceId) return;
      setRaceStatus('running');
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

    const handleRaceFinished = ({ results: res, state }) => {
      if (state?.raceId && raceId && state.raceId !== raceId) return;
      setProgressByCar((prev) => ({ ...prev }));
      setRaceStatus('finished');
      setResults(res || []);
      setCountdown(0);
      fetchReplayLogs().catch(() => {});
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

    const handleRaceError = (payload) => {
      const payloadRaceId = payload?.raceId;
      if (payloadRaceId && raceId && payloadRaceId !== raceId) return;
      const msg = payload?.message || 'Race not found';
      setRaceError(msg);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('race:state', handleRaceState);
    socket.on('race:started', handleRaceStarted);
    socket.on('race:finished', handleRaceFinished);
    socket.on('race:tick', handleRaceTick);
    socket.on('race:error', handleRaceError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('race:state', handleRaceState);
      socket.off('race:started', handleRaceStarted);
      socket.off('race:finished', handleRaceFinished);
      socket.off('race:tick', handleRaceTick);
      socket.off('race:error', handleRaceError);
    };
  }, [raceId]);

  // When the raceId becomes known (e.g. from /race/:id in
  // read-only mode) and the socket is already connected,
  // issue a join so we receive state/ticks or an error.
  useEffect(() => {
    if (!raceId) return;
    if (!socket.connected) return;
    socket.emit('race:join', { raceId });
  }, [raceId]);

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

  useEffect(() => {
    fetchReplayLogs();
  }, []);

  // If we were asked (via localStorage) to open a replay for a
  // specific race, wait until replay logs are loaded and then
  // automatically start the matching replay.
  useEffect(() => {
    if (!pendingReplayRaceId || !Array.isArray(replayLogs) || replayLogs.length === 0) {
      return;
    }
    const match = replayLogs.find((log) => log.raceId === pendingReplayRaceId);
    const target = match || replayLogs[0];
    if (target && target.file) {
      startReplay(target.file);
    }
    setPendingReplayRaceId(null);
  }, [pendingReplayRaceId, replayLogs]);

  // React to explicit view requests coming from the admin dashboard.
  useEffect(() => {
    if (!viewRequest || !viewRequest.raceId) return;
    const { raceId: targetRaceId, status } = viewRequest;
    setRaceId(targetRaceId);
    socket.emit('race:join', { raceId: targetRaceId });

    if (status === 'finished') {
      setPendingReplayRaceId(targetRaceId);
      fetchReplayLogs();
    } else {
      setShowRaceModal(true);
    }
  }, [viewRequest]);

  // In read-only mode (/race/:id), once logs are loaded, automatically
  // play the latest replay whose lobbyId matches this raceId. This
  // lets us map the URL (lobby UUID) to the correct underlying log
  // file, whose internal raceId may differ.
  useEffect(() => {
    if (!readOnly) return;
    if (!raceId) return;
    if (!Array.isArray(replayLogs) || replayLogs.length === 0) return;
    if (autoReplayStarted) return;

    const match = replayLogs.find((log) => log.lobbyId === raceId);
    if (!match || !match.file) return;

    setAutoReplayStarted(true);
    setRaceError(null);
    startReplay(match.file);
  }, [readOnly, raceId, replayLogs, autoReplayStarted]);

  const handleAddCar = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!carName.trim() || !canAddCar) return;
    if (!raceId) return;

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
    socket.emit('car:add', { raceId, car });
    setCarName('');
  };

  const handleRegisterUserCarToRace = (e) => {
    e.preventDefault();
    setRegisterUserCarMessage(null);

    if (!raceId) {
      setRegisterUserCarMessage('Race not found.');
      return;
    }
    if (raceStatus === 'running' || raceStatus === 'finished') {
      setRegisterUserCarMessage('You can only register before the race starts or while it is waiting.');
      return;
    }
    if (!selectedUserCarId) {
      setRegisterUserCarMessage('Select one of your cars first.');
      return;
    }

    const car = userCars.find((c) => c.id === selectedUserCarId);
    if (!car) {
      setRegisterUserCarMessage('Selected car was not found.');
      return;
    }

    const alreadyInRace = cars.some((existing) => existing.id === car.id);
    if (alreadyInRace) {
      setRegisterUserCarMessage('This car is already registered in this race.');
      return;
    }

    setRegisteringUserCar(true);
    try {
      const payloadCar = {
        id: car.id,
        name: car.name,
        color: car.color,
        ownerUserId: user?.id,
        ownerName: user?.name,
        attributes: {
          acceleration: Number(car.acceleration) || 1,
          topSpeed: Number(car.topSpeed) || 1,
          handling: Math.min(1, Math.max(0, Number(car.handling) || 0.5)),
        },
      };

      socket.emit('car:add', { raceId, car: payloadCar });
      setRegisterUserCarMessage(`Registered "${car.name}" to this race.`);
    } catch (err) {
      setRegisterUserCarMessage(err?.message || 'Failed to register car to race.');
    } finally {
      setRegisteringUserCar(false);
    }
  };

  const handleRegisterAdminCarToRace = (e) => {
    e.preventDefault();
    setRegisterAdminCarMessage(null);

    if (!raceId) {
      setRegisterAdminCarMessage('Race not found.');
      return;
    }
    if (raceStatus === 'running' || raceStatus === 'finished') {
      setRegisterAdminCarMessage('You can only register before the race starts or while it is waiting.');
      return;
    }
    if (!selectedAdminCarId) {
      setRegisterAdminCarMessage('Select a car first.');
      return;
    }

    const car = adminCars.find((c) => c.id === selectedAdminCarId);
    if (!car) {
      setRegisterAdminCarMessage('Selected car was not found.');
      return;
    }

    const alreadyInRace = cars.some((existing) => existing.id === car.id);
    if (alreadyInRace) {
      setRegisterAdminCarMessage('This car is already registered in this race.');
      return;
    }

    setRegisteringAdminCar(true);
    try {
      const payloadCar = {
        id: car.id,
        name: car.name,
        color: car.color,
        ownerUserId: car.userId,
        attributes: {
          acceleration: Number(car.acceleration) || 1,
          topSpeed: Number(car.topSpeed) || 1,
          handling: Math.min(1, Math.max(0, Number(car.handling) || 0.5)),
        },
      };

      socket.emit('car:add', { raceId, car: payloadCar });
      setRegisterAdminCarMessage(`Registered "${car.name}" to this race.`);
    } catch (err) {
      setRegisterAdminCarMessage(err?.message || 'Failed to register car to race.');
    } finally {
      setRegisteringAdminCar(false);
    }
  };

  const handleCreateRace = () => {
    if (readOnly) return;
    setResults([]);
    setCountdown(null);
    setCars([]);
    setProgressByCar({});
    setRaceStatus('idle');

    socket.emit('race:create', { durationMs: raceDurationMs }, (resp) => {
      if (resp && resp.raceId) {
        setRaceId(resp.raceId);
      }
    });
  };

  const handleJoinRace = () => {
    if (readOnly) return;
    if (!raceId) return;
    setResults([]);
    setCountdown(null);
    setCars([]);
    setProgressByCar({});
    setRaceStatus('idle');
    socket.emit('race:join', { raceId });
  };

  const handleDurationChange = (value) => {
    if (readOnly) return;
    const seconds = Number(value) || 0;
    const ms = seconds * 1000;
    setRaceDurationMs(ms);
    if (raceId) {
      socket.emit('race:configure', { raceId, durationMs: ms });
    }
  };

  const handleStartRace = () => {
    if (readOnly) return;
    if (!canStartRace) return;
    if (!raceId) return;
    setResults([]);
    socket.emit('race:start', { raceId });
    setShowRaceModal(true);
  };

  const handleAdminStartRace = () => {
    if (!readOnly) return;
    if (!raceId) return;
    if (raceStatus === 'running' || raceStatus === 'finished') return;
    socket.emit('race:start', { raceId });
  };

  const handleResetRace = () => {
    setResults([]);
    setResults([]);
    setCountdown(null);
    setCars([]);
    setRaceStatus('idle');
    if (raceId && !readOnly) {
      socket.emit('race:reset', { raceId });
    }
    setShowRaceModal(false);
  };

  const durationSeconds = Math.round(raceDurationMs / 1000);
  const canAddCar = raceStatus === 'idle' || raceStatus === 'ready';
  const canStartRace = raceStatus !== 'running' && !!raceId && cars.length > 0;

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
      const { cars: logCars = [], ticks = [], results: logResults = [], startedAt, finishedAt, raceId: logRaceId } = log;

      if (readOnly) {
        // On the /race/:id viewer, drive the main track with
        // replay data instead of opening a modal.
        setCars(logCars);
        setResults(Array.isArray(logResults) ? logResults : []);
        setProgressByCar({});
        setReplayMeta({ raceId: logRaceId, startedAt, finishedAt });
      } else {
        // In the admin/racer view, keep using the replay modal.
        setReplayCars(logCars);
        setReplayResults(Array.isArray(logResults) ? logResults : []);
        setReplayProgressByCar({});
        setReplayMeta({ raceId: logRaceId, startedAt, finishedAt });
        setShowReplayModal(true);
      }

      if (!Array.isArray(ticks) || ticks.length === 0) {
        return;
      }

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
            if (readOnly) {
              setProgressByCar((prev) => {
                const next = { ...prev };
                tickArray.forEach((t) => {
                  next[t.carId] = t.progress;
                });
                return next;
              });
            } else {
              setReplayProgressByCar((prev) => {
                const next = { ...prev };
                tickArray.forEach((t) => {
                  next[t.carId] = t.progress;
                });
                return next;
              });
            }
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
    <>
      {renderMain && (
        <main className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
          {readOnly && raceError && (
            <div className="col-span-full mb-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
              {raceId ? (
                <span>
                  Race with ID <span className="font-mono break-all">{raceId}</span> was not found.
                </span>
              ) : (
                <span>Race not found.</span>
              )}
            </div>
          )}
          {!readOnly && (
            <RaceSetupAndGarage
              raceStatus={raceStatus}
              raceId={raceId}
              durationSeconds={durationSeconds}
              cars={cars}
              canStartRace={canStartRace}
              canAddCar={canAddCar}
              carName={carName}
              acceleration={acceleration}
              topSpeed={topSpeed}
              handling={handling}
              onJoinRace={{
                join: handleJoinRace,
                changeRaceId: setRaceId,
              }}
              onCreateRace={handleCreateRace}
              onStartRace={handleStartRace}
              onResetRace={handleResetRace}
              onAddCar={handleAddCar}
              onChangeCarName={setCarName}
              onChangeAcceleration={setAcceleration}
              onChangeTopSpeed={setTopSpeed}
              onChangeHandling={setHandling}
              onChangeDuration={handleDurationChange}
              onShowRaceModal={() => setShowRaceModal(true)}
            />
          )}
          <RaceMonitorAndResults
            cars={cars}
            raceStatus={raceStatus}
            countdown={countdown}
            durationSeconds={durationSeconds}
            progressByCar={progressByCar}
            results={results}
            replayLogs={replayLogs}
            replayLoading={replayLoading}
            replayError={replayError}
            onRefreshReplays={fetchReplayLogs}
            onStartReplay={startReplay}
          />
          {readOnly && user && user.role === 'admin' && (
            <section className="col-span-full mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Register any car</h2>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterAdminCarMessage(null);
                    setAdminCarsError(null);
                    setAdminCarsLoading(true);
                    fetch('http://localhost:4000/admin/cars', {
                      credentials: 'include',
                    })
                      .then((res) => {
                        if (!res.ok) throw new Error('Failed to load cars');
                        return res.json();
                      })
                      .then((data) => {
                        setAdminCars(Array.isArray(data.cars) ? data.cars : []);
                      })
                      .catch((err) => {
                        setAdminCarsError(err?.message || 'Unable to load cars');
                      })
                      .finally(() => {
                        setAdminCarsLoading(false);
                      });
                  }}
                  className="text-[0.7rem] px-2 py-1 rounded-md border border-slate-700 bg-slate-950/70 text-slate-200 hover:bg-slate-800/80"
                >
                  Refresh
                </button>
              </div>
              <div className="mb-3 flex items-center justify-between text-[0.7rem] text-slate-300">
                <span>
                  Status: <span className="capitalize">{raceStatus}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAdminStartRace}
                  disabled={!raceId || raceStatus === 'running' || raceStatus === 'finished'}
                  className="inline-flex items-center justify-center rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1 text-[0.7rem] font-medium text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-500 disabled:opacity-60"
                >
                  Start race
                </button>
              </div>
              <p className="text-[0.7rem] text-slate-400 mb-3">
                Pick any car from the database and register it into this race.
              </p>
              {adminCarsLoading ? (
                <p className="text-[0.75rem] text-slate-400">Loading cars…</p>
              ) : adminCarsError ? (
                <p className="text-[0.7rem] text-rose-300">{adminCarsError}</p>
              ) : adminCars.length === 0 ? (
                <p className="text-[0.75rem] text-slate-400">No cars are available in the database yet.</p>
              ) : (
                <form onSubmit={handleRegisterAdminCarToRace} className="space-y-3 text-[0.7rem]">
                  <div className="flex flex-col gap-1 max-w-xs">
                    <label className="text-slate-300">Car</label>
                    <select
                      value={selectedAdminCarId}
                      onChange={(e) => setSelectedAdminCarId(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">Select a car…</option>
                      {adminCars.map((car) => {
                        const inRace = cars.some((existing) => existing.id === car.id);
                        return (
                          <option key={car.id} value={car.id} disabled={inRace}>
                            {car.name} (acc {car.acceleration}, top {car.topSpeed}, handling {car.handling})
                            {inRace ? ' — already in this race' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {registerAdminCarMessage && (
                    <p className="text-[0.65rem] text-slate-300">{registerAdminCarMessage}</p>
                  )}
                  <button
                    type="submit"
                    disabled={
                      registeringAdminCar ||
                      !raceId ||
                      raceStatus === 'running' ||
                      raceStatus === 'finished'
                    }
                    className="inline-flex items-center justify-center rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1 text-[0.7rem] font-medium text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {registeringAdminCar ? 'Registering…' : 'Register car to this race'}
                  </button>
                </form>
              )}
            </section>
          )}
          {readOnly && user && user.role === 'user' && (
            <section className="col-span-full mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Register one of your cars</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (!user || !user.id) return;
                    setRegisterUserCarMessage(null);
                    setUserCarsError(null);
                    setUserCarsLoading(true);
                    fetch(`http://localhost:4000/user/${encodeURIComponent(user.id)}/cars`, {
                      credentials: 'include',
                    })
                      .then((res) => {
                        if (!res.ok) throw new Error('Failed to load your cars');
                        return res.json();
                      })
                      .then((data) => {
                        setUserCars(Array.isArray(data.cars) ? data.cars : []);
                      })
                      .catch((err) => {
                        setUserCarsError(err?.message || 'Unable to load your cars');
                      })
                      .finally(() => {
                        setUserCarsLoading(false);
                      });
                  }}
                  className="text-[0.7rem] px-2 py-1 rounded-md border border-slate-700 bg-slate-950/70 text-slate-200 hover:bg-slate-800/80"
                >
                  Refresh
                </button>
              </div>
              <p className="text-[0.7rem] text-slate-400 mb-3">
                Choose a car from your garage to register it into this race.
              </p>
              {userCarsLoading ? (
                <p className="text-[0.75rem] text-slate-400">Loading your cars…</p>
              ) : userCarsError ? (
                <p className="text-[0.7rem] text-rose-300">{userCarsError}</p>
              ) : userCars.length === 0 ? (
                <p className="text-[0.75rem] text-slate-400">You have no cars yet. Create one from your dashboard first.</p>
              ) : (
                <form onSubmit={handleRegisterUserCarToRace} className="space-y-3 text-[0.7rem]">
                  <div className="flex flex-col gap-1 max-w-xs">
                    <label className="text-slate-300">Your car</label>
                    <select
                      value={selectedUserCarId}
                      onChange={(e) => setSelectedUserCarId(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">Select one of your cars…</option>
                      {userCars.map((car) => {
                        const inRace = cars.some((existing) => existing.id === car.id);
                        return (
                          <option key={car.id} value={car.id} disabled={inRace}>
                            {car.name} (acc {car.acceleration}, top {car.topSpeed}, handling {car.handling})
                            {inRace ? ' — already in this race' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {registerUserCarMessage && (
                    <p className="text-[0.65rem] text-slate-300">{registerUserCarMessage}</p>
                  )}
                  <button
                    type="submit"
                    disabled={
                      registeringUserCar ||
                      !raceId ||
                      raceStatus === 'running' ||
                      raceStatus === 'finished'
                    }
                    className="inline-flex items-center justify-center rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1 text-[0.7rem] font-medium text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {registeringUserCar ? 'Registering…' : 'Register car to this race'}
                  </button>
                </form>
              )}
            </section>
          )}
        </main>
      )}
      {!readOnly && showRaceModal && (
        <RaceModal
          cars={cars}
          raceStatus={raceStatus}
          countdown={countdown}
          durationSeconds={durationSeconds}
          progressByCar={progressByCar}
          results={results}
          onClose={() => setShowRaceModal(false)}
        />
      )}
      {!readOnly && showReplayModal && (
        <ReplayModal
          cars={replayCars}
          results={replayResults}
          progressByCar={replayProgressByCar}
          meta={replayMeta}
          onClose={() => {
            stopReplay();
            setShowReplayModal(false);
          }}
        />
      )}
    </>
  );
}

export default RaceView;
