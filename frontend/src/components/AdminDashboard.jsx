import React, { useEffect, useState } from 'react';
import { socket } from '../socket.js';

function AdminDashboard({ user, onViewRace, races, raceHistory, users, cars, loading, error, onRefresh }) {
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [selectedRaceDetails, setSelectedRaceDetails] = useState(null);
  const [raceDetailsLoading, setRaceDetailsLoading] = useState(false);
  const [raceDetailsError, setRaceDetailsError] = useState(null);
  const [newRaceDurationSeconds, setNewRaceDurationSeconds] = useState(10);
  const [creatingRace, setCreatingRace] = useState(false);
  const [createRaceError, setCreateRaceError] = useState(null);

  useEffect(() => {
    if (!selectedRaceId) {
      setSelectedRaceDetails(null);
      return;
    }
    const fetchDetails = async () => {
      try {
        setRaceDetailsLoading(true);
        setRaceDetailsError(null);
        const res = await fetch(`http://localhost:4000/admin/race/${encodeURIComponent(selectedRaceId)}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load race details');
        }
        const data = await res.json();
        setSelectedRaceDetails(data);
      } catch (err) {
        const message = err && typeof err === 'object' && 'message' in err ? err.message : null;
        setRaceDetailsError(message || 'Unable to load race details');
        setSelectedRaceDetails(null);
      } finally {
        setRaceDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedRaceId]);

  const handleStartRace = (raceId) => {
    socket.emit('race:start', { raceId });
  };

  const handleCloseRace = (raceId) => {
    socket.emit('race:close', { raceId });
    if (typeof onRefresh === 'function') {
      onRefresh();
    }
    if (selectedRaceId === raceId) {
      setSelectedRaceId(null);
      setSelectedRaceDetails(null);
    }
  };

  const handleCreateRace = () => {
    if (creatingRace) return;
    const seconds = Number(newRaceDurationSeconds);
    const durationMs = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 10000;

    setCreatingRace(true);
    setCreateRaceError(null);

    socket.emit(
      'race:create',
      { durationMs, createdByUserId: user && user.id ? String(user.id) : undefined },
      (resp) => {
        setCreatingRace(false);
        if (!resp || !resp.raceId) {
          setCreateRaceError('Failed to create race');
          return;
        }
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
        setSelectedRaceId(resp.raceId);
      },
    );
  };
  return (
    <main className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
      <section className="space-y-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
              <p className="text-xs text-slate-400 mt-1">Overview of races, users, and cars.</p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="text-[0.7rem] px-3 py-1 rounded-lg border border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 text-slate-300 disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 text-[0.8rem]">
            <div>
              <label className="block text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">
                New race duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                value={newRaceDurationSeconds}
                onChange={(e) => setNewRaceDurationSeconds(e.target.value)}
                className="w-32 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[0.8rem] text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1">
              <button
                type="button"
                onClick={handleCreateRace}
                disabled={creatingRace}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-sky-500 bg-sky-600 text-[0.8rem] font-medium text-white hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingRace ? 'Creating race…' : 'Create race'}
              </button>
              {createRaceError && (
                <p className="text-[0.7rem] text-rose-300">{createRaceError}</p>
              )}
            </div>
          </div>
          {error && (
            <p className="text-[0.75rem] text-rose-300 mb-3">{error}</p>
          )}
          <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3">
              <div className="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Active races</div>
              <div className="text-2xl font-semibold text-slate-50">{races.length}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3">
              <div className="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Users</div>
              <div className="text-2xl font-semibold text-slate-50">{users.length}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3">
              <div className="text-[0.7rem] text-slate-400 uppercase tracking-widest mb-1">Cars</div>
              <div className="text-2xl font-semibold text-slate-50">{cars.length}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">Active races (/admin/race)</h3>
              {races.length === 0 ? (
                <p className="text-[0.8rem] text-slate-500">No active races right now.</p>
              ) : (
                <ul className="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
                  {races.map((r) => (
                    <li
                      key={r.raceId}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5 cursor-pointer hover:border-sky-500/60"
                      onClick={() => setSelectedRaceId(r.raceId)}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-[0.7rem] text-slate-300 truncate max-w-[14rem]">
                          {r.raceId}
                        </span>
                        <span className="text-[0.65rem] text-slate-500">
                          Cars: {r.cars} · Duration: {Math.round((r.durationMs || 0) / 1000)}s
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewRace) {
                              onViewRace(r.raceId, r.status);
                            }
                          }}
                          className="text-[0.65rem] px-2 py-0.5 rounded-full border border-sky-500 bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseRace(r.raceId);
                          }}
                          className="text-[0.65rem] px-2 py-0.5 rounded-full border border-rose-500 bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-60"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRace(r.raceId);
                          }}
                          className="text-[0.65rem] px-2 py-0.5 rounded-full border border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
                        >
                          Start
                        </button>
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-300 capitalize">
                          {r.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedRaceId && (
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">
                  Race details: {selectedRaceId}
                </h3>
                {raceDetailsLoading ? (
                  <p className="text-[0.75rem] text-slate-400">Loading race details…</p>
                ) : raceDetailsError ? (
                  <p className="text-[0.75rem] text-rose-300">{raceDetailsError}</p>
                ) : !selectedRaceDetails || !Array.isArray(selectedRaceDetails.cars) ||
                  selectedRaceDetails.cars.length === 0 ? (
                  <p className="text-[0.75rem] text-slate-400">No cars registered for this race yet.</p>
                ) : (
                  <ul className="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
                    {selectedRaceDetails.cars.map((car) => (
                      <li
                        key={car.id}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-6 rounded-full"
                            style={{ backgroundColor: car.color }}
                          />
                          <div className="flex flex-col">
                            <span className="text-slate-200">{car.name}</span>
                            {car.ownerName && (
                              <span className="text-[0.65rem] text-slate-500">User: {car.ownerName}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-[0.65rem] text-slate-400 flex gap-2">
                          <span>Acc: {car.attributes?.acceleration}</span>
                          <span>Top: {car.attributes?.topSpeed}</span>
                          <span>Handling: {car.attributes?.handling}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">Recent races (DB history)</h3>
              {!raceHistory || raceHistory.length === 0 ? (
                <p className="text-[0.8rem] text-slate-500">No races have been recorded yet.</p>
              ) : (
                <ul className="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
                  {raceHistory.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-[0.7rem] text-slate-300 truncate max-w-[14rem]">
                          {r.id}
                        </span>
                        <span className="text-[0.65rem] text-slate-500">
                          Duration: {Math.round((r.durationMs || 0) / 1000)}s · Created:{' '}
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                          {r.finishedAt && (
                            <>
                              {' · '}Finished: {new Date(r.finishedAt).toLocaleString()}
                            </>
                          )}
                        </span>
                        {r.createdByName && (
                          <span className="text-[0.65rem] text-slate-500">Admin: {r.createdByName}</span>
                        )}
                      </div>
                      <span className="text-[0.65rem] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-300 capitalize">
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Users</h2>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-slate-500">No users found.</p>
          ) : (
            <ul className="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5"
                >
                  <div className="flex flex-col">
                    <span className="text-slate-200">{u.name}</span>
                    {u.username && (
                      <span className="text-[0.65rem] text-slate-500">{u.username}</span>
                    )}
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-widest text-slate-400">{u.role || 'user'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Cars</h2>
          </div>
          {cars.length === 0 ? (
            <p className="text-sm text-slate-500">No cars found.</p>
          ) : (
            <ul className="space-y-1 text-[0.8rem] max-h-40 overflow-auto pr-1">
              {cars.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-6 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-slate-200">{c.name}</span>
                      <span className="text-[0.65rem] text-slate-500">User: {c.userId}</span>
                    </div>
                  </div>
                  <div className="text-[0.65rem] text-slate-400 flex gap-2">
                    <span>Acc: {c.acceleration.toFixed(1)}</span>
                    <span>Top: {c.topSpeed.toFixed(0)}</span>
                    <span>Handling: {c.handling.toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
