import React from 'react';
import CarIcon from './CarIcon.jsx';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';

function ReplayModal({
  cars,
  results,
  progressByCar,
  meta,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-40 px-4">
      <Card className="w-full max-w-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Race replay</h2>
            <p className="text-xs text-slate-400 mt-1">
              Playing back a recorded race exactly as it happened.
            </p>
            {meta && (
              <p className="text-[0.65rem] text-slate-500 mt-1">
                {meta.raceId && <span className="mr-2">{meta.raceId}</span>}
                {meta.startedAt && (
                  <span>
                    {new Date(meta.startedAt).toLocaleTimeString()} -{' '}
                    {meta.finishedAt && new Date(meta.finishedAt).toLocaleTimeString()}
                  </span>
                )}
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={onClose}
            size="sm"
            variant="outline"
            className="text-xs px-3 py-1"
          >
            Close
          </Button>
        </div>
        <div className="border border-slate-800 rounded-xl px-3 py-3 bg-slate-950/60 max-h-64 overflow-auto mb-3 space-y-1">
          {cars.length === 0 ? (
            <p className="text-xs text-slate-500">No cars in this replay.</p>
          ) : (
            <>
              {cars.slice(0, 12).map((car) => {
                const progressRaw = progressByCar[car.id] ?? 0;
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
              {cars.length > 12 && (
                <div className="text-[0.65rem] text-slate-500 mt-1">
                  + {cars.length - 12} more cars
                </div>
              )}
            </>
          )}
        </div>
        {results && results.length > 0 && (
          <div className="mt-2 border-t border-slate-800 pt-3">
            <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-widest">Results</h3>
            <ol className="space-y-1 text-xs">
              {results.map((r) => {
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
          </div>
        )}
      </Card>
    </div>
  );
}

export default ReplayModal;
