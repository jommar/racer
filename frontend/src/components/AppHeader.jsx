import React from 'react';
import CarIcon from './CarIcon.jsx';

function AppHeader({
  user,
  socketConnected,
  socketError,
  onLogout,
  isAdmin,
  activeView,
  onChangeView,
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-4 mb-6 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 pb-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          {user && (
            <div className="flex flex-col items-end text-xs text-slate-300 mr-2">
              <span className="font-semibold">{user.name}</span>
              {user.role && (
                <span className="uppercase tracking-widest text-[0.6rem] text-slate-400">{user.role}</span>
              )}
            </div>
          )}
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border text-xs font-medium ${
              socketConnected
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            {socketConnected ? 'Connected to backend' : 'Disconnected'}
          </span>
          {socketError && (
            <span className="text-[0.65rem] text-rose-300 max-w-[14rem] truncate">
              {socketError}
            </span>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="text-xs px-3 py-1 rounded-lg border border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 text-slate-300"
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-2 text-xs">
        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => onChangeView('racer')}
              className={`px-3 py-1.5 rounded-full border text-[0.7rem] font-medium transition-colors ${
                activeView === 'racer'
                  ? 'border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/40'
                  : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              Race view
            </button>
            <button
              type="button"
              onClick={() => onChangeView('admin')}
              className={`px-3 py-1.5 rounded-full border text-[0.7rem] font-medium transition-colors ${
                activeView === 'admin'
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                  : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              Admin dashboard
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onChangeView('user-dashboard')}
            className={`px-3 py-1.5 rounded-full border text-[0.7rem] font-medium transition-colors ${
              activeView === 'user-dashboard'
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            User dashboard
          </button>
        )}
      </nav>
    </header>
  );
}

export default AppHeader;
