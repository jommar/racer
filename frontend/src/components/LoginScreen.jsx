import React, { useState } from 'react';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';
import TextField from './ui/TextField.jsx';

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
    <div className="min-h-screen text-slate-50 flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
            Racing Arena
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to manage races. Use one of the seeded accounts, for example
            <span className="block mt-1 text-[0.7rem] text-slate-300">admin / admin123</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
            <TextField
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <TextField
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-[0.75rem] text-rose-300">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            className="mt-2"
            variant="primary"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-5 text-[0.65rem] text-slate-500 border-t border-slate-800 pt-3">
          <div className="mb-1 text-slate-400">Other seeded users</div>
          <ul className="space-y-0.5 text-slate-300">
            <li>Alice — alice / alice123</li>
            <li>Bob — bob / bob123</li>
            <li>Race Admin — raceadmin / raceadmin123</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default LoginScreen;
