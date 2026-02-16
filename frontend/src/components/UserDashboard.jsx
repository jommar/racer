import React, { useEffect, useState } from 'react';
import { socket } from '../socket.js';
import Card from './ui/Card.jsx';
import Button from './ui/Button.jsx';
import TextField from './ui/TextField.jsx';

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function UserDashboard({ user }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [acceleration, setAcceleration] = useState(5);
  const [topSpeed, setTopSpeed] = useState(200);
  const [handling, setHandling] = useState(0.7);

  // Active live races created by admins (from /admin/race)
  const [races, setRaces] = useState([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [racesError, setRacesError] = useState(null);
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState(null);

  const fetchCars = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:4000/user/${encodeURIComponent(user.id)}/cars`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load cars');
      const data = await res.json();
      setCars(Array.isArray(data.cars) ? data.cars : []);
    } catch (err) {
      setError(err?.message || 'Unable to load cars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [user?.id]);

  const fetchRaces = async () => {
    try {
      setRacesLoading(true);
      setRacesError(null);
      const res = await fetch('http://localhost:4000/admin/race', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load races');
      const data = await res.json();
      const list = Array.isArray(data.races) ? data.races : [];
      setRaces(list);
      // Default to first joinable race if none selected yet.
      if (!selectedRaceId && list.length > 0) {
        const joinable = list.find((r) => r.status === 'idle' || r.status === 'ready');
        if (joinable) {
          setSelectedRaceId(joinable.raceId);
        }
      }
    } catch (err) {
      setRacesError(err?.message || 'Unable to load races');
    } finally {
      setRacesLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCar = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!name.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const body = {
        name: name.trim(),
        color: randomColor(),
        acceleration: Number(acceleration) || 1,
        topSpeed: Number(topSpeed) || 1,
        handling: Math.min(1, Math.max(0, Number(handling) || 0.5)),
      };
      const res = await fetch(`http://localhost:4000/user/${encodeURIComponent(user.id)}/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create car');
      const data = await res.json();
      if (data && data.car) {
        setCars((prev) => [...prev, data.car]);
        setName('');
      } else {
        await fetchCars();
      }
    } catch (err) {
      setError(err?.message || 'Unable to create car');
    } finally {
      setCreating(false);
    }
  };

  const handleRegisterCarToRace = (e) => {
    e.preventDefault();
    setRegisterMessage(null);

    if (!selectedRaceId) {
      setRegisterMessage('Select a live race first.');
      return;
    }
    if (!selectedCarId) {
      setRegisterMessage('Select one of your cars to register.');
      return;
    }

    const car = cars.find((c) => c.id === selectedCarId);
    if (!car) {
      setRegisterMessage('Selected car not found.');
      return;
    }

    setRegistering(true);
    try {
      const payloadCar = {
        id: car.id,
        name: car.name,
        color: car.color,
        ownerUserId: user?.id,
        ownerName: user?.name,
        attributes: {
          acceleration: Number(car.acceleration) || 1,
          topSpeed: Number(car.topSpeed) || 1,
          handling: Math.min(1, Math.max(0, Number(car.handling) || 0.5)),
        },
      };

      // Join the selected race room and register this car.
      socket.emit('race:join', { raceId: selectedRaceId });
      socket.emit('car:add', { raceId: selectedRaceId, car: payloadCar });

      setRegisterMessage(`Registered "${car.name}" to race ${selectedRaceId}.`);
    } catch (err) {
      setRegisterMessage(err?.message || 'Failed to register car to race.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <section className="mb-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold mb-2">Profile</h2>
          <dl className="text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <dt className="text-slate-400">Name</dt>
              <dd>{user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Username</dt>
              <dd>{user?.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Role</dt>
              <dd className="uppercase tracking-widest text-[0.6rem] text-slate-400">{user?.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">User ID</dt>
              <dd className="text-[0.6rem] text-slate-500 truncate max-w-[12rem] text-right">{user?.id}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-2">Create a garage car</h2>
          <p className="text-[0.7rem] text-slate-400 mb-3">
            Cars created here are stored in the database and associated with your account.
          </p>
          <form onSubmit={handleCreateCar} className="space-y-2 text-[0.7rem]">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Car name</label>
              <TextField
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="py-1 text-xs"
                placeholder="e.g. Thunderbolt"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Acceleration</label>
                <TextField
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={acceleration}
                  onChange={(e) => setAcceleration(e.target.value)}
                  className="py-1 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Top speed</label>
                <TextField
                  type="number"
                  min="50"
                  max="400"
                  step="10"
                  value={topSpeed}
                  onChange={(e) => setTopSpeed(e.target.value)}
                  className="py-1 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Handling</label>
                <TextField
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={handling}
                  onChange={(e) => setHandling(e.target.value)}
                  className="py-1 text-xs"
                />
              </div>
            </div>
            {error && (
              <p className="text-[0.65rem] text-rose-300">{error}</p>
            )}
            <Button
              type="submit"
              disabled={creating}
              size="sm"
              className="mt-1 text-[0.7rem]"
            >
              {creating ? 'Creating…' : 'Create car'}
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">My cars</h2>
          <Button
            type="button"
            onClick={fetchCars}
            variant="secondary"
            size="sm"
            className="text-[0.7rem] px-2 py-1"
          >
            Refresh
          </Button>
        </div>
        {loading ? (
          <p className="text-[0.75rem] text-slate-400">Loading cars…</p>
        ) : cars.length === 0 ? (
          <p className="text-[0.75rem] text-slate-400">No cars yet. Create one above to start your garage.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.7rem] text-left text-slate-200">
              <thead className="text-[0.65rem] uppercase tracking-wide text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Color</th>
                  <th className="py-2 pr-3">Accel</th>
                  <th className="py-2 pr-3">Top speed</th>
                  <th className="py-2 pr-3">Handling</th>
                  <th className="py-2 pr-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="py-1 pr-3 font-medium">{car.name}</td>
                    <td className="py-1 pr-3">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-700"
                          style={{ backgroundColor: car.color }}
                        />
                        <span className="text-[0.65rem] text-slate-400">{car.color}</span>
                      </span>
                    </td>
                    <td className="py-1 pr-3">{car.acceleration}</td>
                    <td className="py-1 pr-3">{car.topSpeed}</td>
                    <td className="py-1 pr-3">{car.handling}</td>
                    <td className="py-1 pr-3 text-[0.6rem] text-slate-500">
                      {car.createdAt ? new Date(car.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Join a live race</h2>
          <Button
            type="button"
            onClick={fetchRaces}
            variant="secondary"
            size="sm"
            className="text-[0.7rem] px-2 py-1"
          >
            Refresh races
          </Button>
        </div>
        <p className="text-[0.7rem] text-slate-400 mb-3">
          Pick one of your cars and register it into a live race created by an admin.
        </p>
        {racesLoading ? (
          <p className="text-[0.75rem] text-slate-400">Loading races…</p>
        ) : racesError ? (
          <p className="text-[0.7rem] text-rose-300">{racesError}</p>
        ) : races.length === 0 ? (
          <p className="text-[0.75rem] text-slate-400">No live races are currently available.</p>
        ) : (
          <form onSubmit={handleRegisterCarToRace} className="space-y-3 text-[0.7rem]">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Live race</label>
                <select
                  value={selectedRaceId}
                  onChange={(e) => setSelectedRaceId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Select a race…</option>
                  {races.map((race) => (
                    <option key={race.raceId} value={race.raceId}>
                      {race.raceId} — {race.status} ({Math.round((race.durationMs || 0) / 1000)}s, {race.cars} cars)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Your car</label>
                <select
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Select one of your cars…</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name} (acc {car.acceleration}, top {car.topSpeed}, handling {car.handling})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {registerMessage && (
              <p className="text-[0.65rem] text-slate-300">{registerMessage}</p>
            )}
            <Button
              type="submit"
              disabled={registering || cars.length === 0 || races.length === 0}
              size="sm"
              className="text-[0.7rem]"
              variant="primary"
            >
              {registering ? 'Registering…' : 'Register car to race'}
            </Button>
          </form>
        )}
      </Card>
    </section>
  );
}

export default UserDashboard;
