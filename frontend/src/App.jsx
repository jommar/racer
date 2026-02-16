import React, { useEffect, useState } from 'react';
import AppHeader from './components/AppHeader.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import AdminView from './components/AdminView.jsx';
import RaceView from './components/RaceView.jsx';
import UserDashboard from './components/UserDashboard.jsx';

const LOCAL_KEY_USER = 'racer:user';

function App() {
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);

  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('racer'); // 'racer' | 'admin' | 'user-dashboard' | 'race-page'

  useEffect(() => {
    const loadUserFromSession = async () => {
      try {
        const res = await fetch('http://localhost:4000/auth/me', {
          credentials: 'include',
        });
        if (!res.ok) {
          setUser(null);
          setActiveView('racer');
          try {
            window.localStorage.removeItem(LOCAL_KEY_USER);
          } catch {
            // ignore
          }
          return;
        }
        const data = await res.json();
        if (data && data.user) {
          if (typeof window !== 'undefined') {
            const path = window.location.pathname || '';
            if (path.startsWith('/race/')) {
              setUser(data.user);
              setActiveView('race-page');
            } else {
              handleLoginSuccess(data.user);
            }
          } else {
            handleLoginSuccess(data.user);
          }
        }
      } catch {
        // ignore network errors on boot; user will see login
      }
    };
    if (typeof window !== 'undefined') {
      loadUserFromSession();
    }
  }, []);

  useEffect(() => {
    try {
      if (user) {
        window.localStorage.setItem(LOCAL_KEY_USER, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(LOCAL_KEY_USER);
      }
    } catch {
      // ignore storage errors
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      if (path.startsWith('/race/')) {
        setActiveView('race-page');
        return;
      }
    }

    if (loggedInUser.role === 'admin') {
      setActiveView('admin');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/admin');
      }
    } else {
      setActiveView('user-dashboard');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/user');
      }
    }
  };

  const handleLogout = () => {
    // Inform backend to clear session cookie, then reset local state.
    fetch('http://localhost:4000/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // ignore network errors on logout
    });

    setUser(null);
    setActiveView('racer');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/login');
      try {
        window.localStorage.removeItem(LOCAL_KEY_USER);
      } catch {
        // ignore
      }
    }
  };

    // Visiting /login on the frontend should clear auth state and show the login screen.
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname || '';
      if (path.endsWith('/login')) {
        setUser(null);
        setActiveView('racer');
        try {
          window.localStorage.removeItem(LOCAL_KEY_USER);
        } catch {
          // ignore storage errors
        }
      }
    }, []);

  const handleSocketStatusChange = (connected, error) => {
    setSocketConnected(connected);
    setSocketError(error);
  };

  const handleViewRaceFromAdmin = (raceId) => {
    if (typeof window !== 'undefined') {
      const urlRaceId = encodeURIComponent(raceId || '');
      window.open(`/race/${urlRaceId}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Basic frontend routing: /login clears auth (handled above),
  // /admin shows admin view for admins, /user shows racer view, /race/:id shows read-only race.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '';
    if (path.startsWith('/race/')) {
      setActiveView('race-page');
    } else if (path.endsWith('/admin')) {
      if (user && user.role === 'admin') {
        setActiveView('admin');
      } else {
        setActiveView('user-dashboard');
        window.history.replaceState({}, '', '/user');
      }
    } else if (path.endsWith('/user')) {
      setActiveView('user-dashboard');
    }
  }, [user]);

  if (!user) {
    return (
      <LoginScreen onLoginSuccess={handleLoginSuccess} />
    );
  }

  const isAdmin = user && user.role === 'admin';

  // Dedicated race viewer page: no navigation/header, just the read-only race view.
  if (activeView === 'race-page') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center items-start py-6 px-4 overflow-y-auto">
        <div className="w-full max-w-5xl">
          <RaceView
            onSocketStatusChange={handleSocketStatusChange}
            user={user}
            readOnly
          />
        </div>
      </div>
    );
  }

  const handleChangeView = (view) => {
    const isAdminUser = user && user.role === 'admin';

    // Regular users are restricted to their own dashboard.
    if (!isAdminUser && view !== 'user-dashboard') {
      view = 'user-dashboard';
    }

    setActiveView(view);
    if (typeof window === 'undefined') return;
    if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (view === 'user-dashboard') {
      window.history.pushState({}, '', '/user');
    } else if (view === 'racer') {
      if (user && user.role === 'admin') {
        window.history.pushState({}, '', '/admin');
      } else {
        window.history.pushState({}, '', '/user');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center items-start py-6 px-4 overflow-y-auto">
      <div className="w-full max-w-5xl">
        <AppHeader
          user={user}
          socketConnected={socketConnected}
          socketError={socketError}
          onLogout={handleLogout}
          isAdmin={!!isAdmin}
          activeView={activeView}
          onChangeView={handleChangeView}
        />

        {activeView === 'admin' && isAdmin ? (
          <AdminView user={user} onViewRace={handleViewRaceFromAdmin} />
        ) : !isAdmin || activeView === 'user-dashboard' ? (
          <UserDashboard user={user} />
        ) : activeView === 'race-page' ? (
          <RaceView
            onSocketStatusChange={handleSocketStatusChange}
            user={user}
            readOnly
          />
        ) : (
          <RaceView onSocketStatusChange={handleSocketStatusChange} user={user} />
        )}
      </div>
    </div>
  );
}

export default App;
