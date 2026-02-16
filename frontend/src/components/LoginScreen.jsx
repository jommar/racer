import React, { useState } from 'react';

function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Invalid username or password');
        } else {
          setError('Login failed');
        }
        return;
      }
      const data = await res.json();
      if (data && data.user) {
        setUsername('');
        setPassword('');
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError(err?.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/70">
        <h1 className="text-2xl font-bold mb-1">Racing Arena</h1>
        <p className="text-xs text-slate-400 mb-4">
          Sign in to manage races. Use one of the seeded accounts, for example
          <span className="block mt-1 text-[0.7rem] text-slate-300">admin / admin123</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
            <input
              type="text"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50 placeholder:text-slate-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 text-slate-50 placeholder:text-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-[0.75rem] text-rose-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-lg px-4 py-2 text-sm font-medium border border-emerald-500/70 bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-[0.65rem] text-slate-500">
          Other seeded users:
          <ul className="mt-1 space-y-0.5">
            <li>Alice: alice / alice123</li>
            <li>Bob: bob / bob123</li>
            <li>Race Admin: raceadmin / raceadmin123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
