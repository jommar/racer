import React from 'react';
import CarIcon from './CarIcon.jsx';

function RaceModal({
  cars,
  raceStatus,
  countdown,
  durationSeconds,
  progressByCar,
  results,
  onClose,
}) {
  if (!cars) return null;

  return (
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
            onClick={onClose}
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
  );
}

export default RaceModal;
