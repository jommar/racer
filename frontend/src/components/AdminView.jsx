import React, { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard.jsx';

function AdminView({ user, onViewRace }) {
  const [races, setRaces] = useState([]);
  const [raceHistory, setRaceHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [racesRes, usersRes, carsRes] = await Promise.all([
        fetch('http://localhost:4000/admin/race', { credentials: 'include' }),
        fetch('http://localhost:4000/admin/users', { credentials: 'include' }),
        fetch('http://localhost:4000/admin/cars', { credentials: 'include' }),
      ]);

      if (!racesRes.ok || !usersRes.ok || !carsRes.ok) {
        throw new Error('Failed to load admin data');
      }

      const [racesJson, usersJson, carsJson] = await Promise.all([
        racesRes.json(),
        usersRes.json(),
        carsRes.json(),
      ]);

      setRaces(Array.isArray(racesJson.races) ? racesJson.races : []);
      setUsers(Array.isArray(usersJson.users) ? usersJson.users : []);
      setCars(Array.isArray(carsJson.cars) ? carsJson.cars : []);

      // Load race history separately; if it fails (e.g. endpoint missing),
      // we simply show an empty history instead of breaking the whole screen.
      try {
        const historyRes = await fetch('http://localhost:4000/admin/race/history', {
          credentials: 'include',
        });
        if (historyRes.ok) {
          const historyJson = await historyRes.json();
          setRaceHistory(Array.isArray(historyJson.races) ? historyJson.races : []);
        } else {
          setRaceHistory([]);
        }
      } catch {
        setRaceHistory([]);
      }
    } catch (err) {
      setError(err?.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <AdminDashboard
      user={user}
      onViewRace={onViewRace}
      races={races}
      raceHistory={raceHistory}
      users={users}
      cars={cars}
      loading={loading}
      error={error}
      onRefresh={fetchAdminData}
    />
  );
}

export default AdminView;
