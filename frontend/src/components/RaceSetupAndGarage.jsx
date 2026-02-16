import React from 'react';
import Badge from './ui/Badge.jsx';

function RaceSetupAndGarage({
  raceStatus,
  raceId,
  durationSeconds,
  cars,
  canStartRace,
  canAddCar,
  carName,
  acceleration,
  topSpeed,
  handling,
  onJoinRace,
  onCreateRace,
  onStartRace,
  onResetRace,
  onAddCar,
  onChangeCarName,
  onChangeAcceleration,
  onChangeTopSpeed,
  onChangeHandling,
  onChangeDuration,
  onShowRaceModal,
}) {
  return (
    <section className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Race Setup</h2>
            <p className="text-xs text-slate-400 mt-1">Configure race duration and add cars.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="uppercase tracking-wide text-[0.65rem]">Status:</span>
            <Badge
              variant={
                raceStatus === 'running'
                  ? 'success'
                  : raceStatus === 'ready'
                  ? 'info'
                  : raceStatus === 'finished'
                  ? 'warning'
                  : 'neutral'
              }
            >
              {raceStatus || 'idle'}
            </Badge>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Race ID</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste or create a race ID"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50 placeholder:text-slate-500"
                value={raceId}
                onChange={(e) => onJoinRace.changeRaceId(e.target.value.trim())}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 text-[0.7rem]">
              <button
                type="button"
                onClick={onJoinRace.join}
                disabled={!raceId}
                className="px-2 py-1 rounded border border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join race
              </button>
              <button
                type="button"
                onClick={onCreateRace}
                className="px-2 py-1 rounded border border-emerald-500/70 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              >
                New race
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Race duration (seconds)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="600"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 text-slate-50 placeholder:text-slate-500"
                value={durationSeconds}
                onChange={(e) => onChangeDuration(e.target.value)}
              />
              <span className="text-xs text-slate-500">sec</span>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <button
              type="button"
              onClick={onStartRace}
              disabled={!canStartRace}
              className="inline-flex justify-center items-center rounded-lg px-4 py-2.5 text-sm font-medium shadow-md shadow-emerald-500/25 transition-all border border-emerald-500/70 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Start race
            </button>
            <button
              type="button"
              onClick={onResetRace}
              className="inline-flex justify-center items-center rounded-lg px-4 py-2 text-xs font-medium border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onShowRaceModal}
              disabled={!cars.length}
              className="inline-flex justify-center items-center rounded-lg px-4 py-2 text-xs font-medium border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              View live race
            </button>
          </div>
        </div>

        <form
          onSubmit={onAddCar}
          className="mt-4 border-t border-slate-800 pt-4 grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4"
        >
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Car name</label>
            <input
              type="text"
              required
              disabled={!canAddCar}
              placeholder="e.g. Thunderbolt GT"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50 placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={carName}
              onChange={(e) => onChangeCarName(e.target.value)}
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
                onChange={(e) => onChangeAcceleration(e.target.value)}
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
                onChange={(e) => onChangeTopSpeed(e.target.value)}
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
                onChange={(e) => onChangeHandling(e.target.value)}
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
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/40 bg-slate-950/40 px-3 py-2 text-xs hover:bg-slate-900/80 transition-colors"
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
  );
}

export default RaceSetupAndGarage;
