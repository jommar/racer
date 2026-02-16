import React from 'react';
import CarIcon from './CarIcon.jsx';

function RaceMonitorAndResults({
  cars,
  raceStatus,
  countdown,
  durationSeconds,
  progressByCar,
  results,
  replayLogs,
  replayLoading,
  replayError,
  onRefreshReplays,
  onStartReplay,
}) {
  return (
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
              onClick={onRefreshReplays}
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
                    onClick={() => onStartReplay(log.file)}
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
  );
}

export default RaceMonitorAndResults;
