import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import { RaceManager, RaceState, Car, RaceTick } from './race';
import * as fs from 'fs';
import * as path from 'path';
import { query } from './db';

const DEFAULT_FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = [
  // React/Vite frontend
  DEFAULT_FRONTEND_ORIGIN,
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  // Vue/Nuxt frontend
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const SESSION_COOKIE_NAME = 'racer_session';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  },
});

const PORT = process.env.PORT || 4000;

// Basic CORS handling for frontend running on a different origin.
app.use((req, res, next) => {
  const requestOrigin = (req.headers.origin as string | undefined) || DEFAULT_FRONTEND_ORIGIN;
  const allowOrigin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : DEFAULT_FRONTEND_ORIGIN;

  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

type Session = {
  /** Opaque session identifier stored only server-side and in the cookie. */
  id: string;
  /** Database user id this session belongs to. */
  userId: string;
  name: string;
  username: string;
  role: string;
};

const sessions = new Map<string, Session>();

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(';');
  for (const part of parts) {
    const [k, ...v] = part.split('=');
    if (!k) continue;
    const key = k.trim();
    if (!key) continue;
    out[key] = decodeURIComponent(v.join('=').trim());
  }
  return out;
}

function getSessionFromRequest(req: express.Request): Session | null {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SESSION_COOKIE_NAME];
  if (!sid) return null;
  const session = sessions.get(sid);
  return session || null;
}

function setSessionCookie(res: express.Response, sessionId: string) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.header('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res: express.Response) {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.header('Set-Cookie', parts.join('; '));
}

type RaceContext = {
  id: string;
  manager: RaceManager;
};

// In-memory collection of active races, keyed by a lobby UUID.
const races = new Map<string, RaceManager>();

async function createRace(initialDurationMs?: number, createdByUserId?: string | null): Promise<RaceContext> {
  const id = randomUUID();
  const manager = new RaceManager();
  // Tie this manager (and its future logs) to the lobby UUID
  // so we can later map logs back to /race/:id.
  manager.setLobbyId(id);
  if (typeof initialDurationMs === 'number' && initialDurationMs > 0) {
    manager.configure(initialDurationMs);
  }
  races.set(id, manager);

  const durationMs = manager.getState().durationMs;
  try {
    await query(
      'INSERT INTO races (id, created_by, status, duration_ms) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
      [id, createdByUserId ?? null, 'idle', durationMs],
    );
  } catch (err) {
    console.error('Error persisting race to database', err);
  }

  return { id, manager };
}

function getRace(raceId: string | undefined | null): RaceContext | undefined {
  if (!raceId) return undefined;
  const manager = races.get(raceId);
  if (!manager) return undefined;
  return { id: raceId, manager };
}

function emitRaceStateToRoom(raceId: string, manager: RaceManager) {
  const state: RaceState = manager.getState();
  io.to(raceId).emit('race:state', { ...state, raceId });
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('server:welcome', { message: 'Welcome to the racing backend' });

  // Admin creates a new race lobby identified by a UUID.
  socket.on(
    'race:create',
    async (payload: { durationMs?: number; createdByUserId?: string } | undefined, ack?: (resp: { raceId: string }) => void) => {
      const duration = payload && typeof payload.durationMs === 'number' ? payload.durationMs : undefined;
      const createdByUserId = payload && typeof payload.createdByUserId === 'string' ? payload.createdByUserId : undefined;
      const { id, manager } = await createRace(duration, createdByUserId ?? null);
      socket.join(id);
      const response = { raceId: id };
      if (ack) {
        ack(response);
      } else {
        socket.emit('race:created', response);
      }
      emitRaceStateToRoom(id, manager);
    },
  );

  // A user joins an existing race lobby using its UUID.
  socket.on('race:join', (payload: { raceId: string }) => {
    const raceId = payload?.raceId;
    const ctx = getRace(raceId);
    if (!ctx) {
      socket.emit('race:error', { raceId, message: 'Race not found' });
      return;
    }
    socket.join(ctx.id);
    const state: RaceState = ctx.manager.getState();
    socket.emit('race:state', { ...state, raceId: ctx.id });
  });

  /**
   * Configure the race duration in milliseconds for a specific race.
   */
  socket.on('race:configure', (payload: { raceId: string; durationMs: number }) => {
    const raceId = payload?.raceId;
    const ctx = getRace(raceId);
    if (!ctx) {
      socket.emit('race:error', { raceId, message: 'Race not found' });
      return;
    }
    const duration = Number(payload?.durationMs) || 10000;
    ctx.manager.configure(duration);
    emitRaceStateToRoom(ctx.id, ctx.manager);
  });

  /**
   * Add a new car to a specific race lobby.
   */
  socket.on('car:add', (payload: { raceId: string; car: Car }) => {
    const raceId = payload?.raceId;
    const ctx = getRace(raceId);
    if (!ctx) {
      socket.emit('race:error', { raceId, message: 'Race not found' });
      return;
    }
    const car = payload.car;
    if (!car || !car.id || !car.name || !car.color) {
      return;
    }
    ctx.manager.addCar(car);
    emitRaceStateToRoom(ctx.id, ctx.manager);
  });

  /**
   * Start the race using the current cars and configured duration
   * for the specified race lobby.
   */
  socket.on('race:start', (payload: { raceId: string }) => {
    const raceId = payload?.raceId;
    const ctx = getRace(raceId);
    if (!ctx) {
      socket.emit('race:error', { raceId, message: 'Race not found' });
      return;
    }

    const started = ctx.manager.start(
      (tick: RaceTick[]) => {
        if (tick && tick.length > 0) {
          io.to(ctx.id).emit('race:tick', { tick });
        }
      },
      (results, state) => {
        io.to(ctx.id).emit('race:finished', { results, state: { ...state, raceId: ctx.id } });
        emitRaceStateToRoom(ctx.id, ctx.manager);

        // Persist finished status & timestamp for this race.
        query('UPDATE races SET status = $1, finished_at = NOW() WHERE id = $2', [
          'finished',
          ctx.id,
        ]).catch((err) => {
          console.error('Error updating race to finished in database', err);
        });
      },
    );
    if (started) {
      // Persist running status when the race actually starts.
      query('UPDATE races SET status = $1 WHERE id = $2', ['running', ctx.id]).catch((err) => {
        console.error('Error updating race to running in database', err);
      });
      io.to(ctx.id).emit('race:started', {
        raceId: ctx.id,
        startedAt: Date.now(),
        durationMs: ctx.manager.getState().durationMs,
      });
    }
  });

  /**
   * Reset a specific race back to an idle, empty state.
   */
  socket.on('race:reset', (payload: { raceId: string }) => {
    const raceId = payload?.raceId;
    const ctx = getRace(raceId);
    if (!ctx) {
      socket.emit('race:error', { raceId, message: 'Race not found' });
      return;
    }
    ctx.manager.clear();
    emitRaceStateToRoom(ctx.id, ctx.manager);

    // Reset status in the database to idle and clear finished_at.
    query('UPDATE races SET status = $1, finished_at = NULL WHERE id = $2', ['idle', ctx.id]).catch(
      (err) => {
        console.error('Error resetting race status in database', err);
      },
    );
  });

  /**
   * Close a race entirely so it is no longer considered active.
   * This stops any running simulation, removes it from the in-memory map,
   * and marks the race as closed in the database.
   */
  socket.on('race:close', (payload: { raceId: string }) => {
    const raceId = payload?.raceId;
    const ctx = getRace(raceId);
    if (!ctx) {
      socket.emit('race:error', { raceId, message: 'Race not found' });
      return;
    }

    // Stop timers and reset internal state, then drop from active map.
    ctx.manager.clear();
    races.delete(ctx.id);

    // Mark the race as closed in the database and set finished_at if not already set.
    query('UPDATE races SET status = $1, finished_at = COALESCE(finished_at, NOW()) WHERE id = $2', [
      'closed',
      ctx.id,
    ]).catch((err) => {
      console.error('Error closing race in database', err);
    });

    io.to(ctx.id).emit('race:closed', { raceId: ctx.id });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get('/', (_req, res) => {
  res.send('Racing backend is running');
});

// Simple race log listing for replay/debug UI.
app.get('/logs', (_req, res) => {
  const logDir = path.join(__dirname, '..', 'logs');
  let files: string[] = [];
  try {
    files = fs.readdirSync(logDir).filter((f) => f.endsWith('.json'));
  } catch {
    // no logs yet
  }

  const logs = files.map((file) => {
    try {
      const fullPath = path.join(logDir, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(raw) as {
        raceId?: string;
        lobbyId?: string;
        startedAt?: number;
        finishedAt?: number;
      };
      return {
        file,
        raceId: parsed.raceId ?? file.replace(/\.json$/, ''),
        lobbyId: parsed.lobbyId ?? null,
        startedAt: parsed.startedAt ?? null,
        finishedAt: parsed.finishedAt ?? null,
      };
    } catch {
      return { file, raceId: file.replace(/\.json$/, ''), startedAt: null, finishedAt: null };
    }
  });

  res.json({ logs });
});

// Fetch a specific race log by file name.
app.get('/logs/:file', (req, res) => {
  const requested = req.params.file;
  // Basic guard to avoid directory traversal.
  if (!requested || requested.includes('..') || !requested.endsWith('.json')) {
    res.status(400).json({ error: 'Invalid log file' });
    return;
  }
  const logDir = path.join(__dirname, '..', 'logs');
  const fullPath = path.join(logDir, requested);
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    res.type('application/json').send(raw);
  } catch {
    res.status(404).json({ error: 'Log not found' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

// --- Admin & User HTTP endpoints ---

// Simple admin endpoint to inspect active races.
// New canonical path: /admin/race (singular); keep /admin/races as alias.
const adminRacesHandler = (_req: express.Request, res: express.Response) => {
  const all = Array.from(races.entries()).map(([id, manager]) => {
    const state = manager.getState();
    return {
      raceId: id,
      status: state.status,
      cars: state.cars.length,
      durationMs: state.durationMs,
    };
  });
  res.json({ races: all });
};

app.get('/admin/races', adminRacesHandler);
app.get('/admin/race', adminRacesHandler);

// Historical races stored in Postgres (including finished ones).
// NOTE: This must be declared before the /admin/race/:raceId route so that
// the literal path segment "history" is not interpreted as a raceId.
app.get('/admin/race/history', async (_req, res) => {
  try {
    const sql = `
      SELECT r.id,
             r.status,
             r.duration_ms AS "durationMs",
             r.created_at AS "createdAt",
             r.finished_at AS "finishedAt",
             r.created_by AS "createdBy",
             u.name AS "createdByName"
      FROM races r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `;
    const result = await query<{
      id: string;
      status: string;
      durationMs: number;
      createdAt: string;
      finishedAt: string | null;
      createdBy: string | null;
      createdByName: string | null;
    }>(sql, []);
    res.json({ races: result.rows });
  } catch (err) {
    console.error('Error fetching race history', err);
    res.status(500).json({ error: 'Failed to fetch race history' });
  }
});

// Detailed view of a single active race including its registered cars.
app.get('/admin/race/:raceId', (req, res) => {
  const raceId = req.params.raceId;
  const ctx = getRace(raceId);
  if (!ctx) {
    res.status(404).json({ error: 'Race not found' });
    return;
  }
  const state = ctx.manager.getState();
  res.json({
    raceId: ctx.id,
    status: state.status,
    durationMs: state.durationMs,
    cars: state.cars,
  });
});

// --- User endpoints backed by Postgres ---

// Simple username/password login using seeded users table.
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Missing or invalid username/password' });
    return;
  }

  try {
    const sql =
      'SELECT id, name, username, role FROM users WHERE username = $1 AND password = $2 LIMIT 1';
    const result = await query<{
      id: string;
      name: string;
      username: string;
      role: string;
    }>(sql, [username, password]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    // Create in-memory session and set HttpOnly cookie.
    const sessionId = randomUUID();
    const session: Session = {
      id: sessionId,
      userId: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    };
    sessions.set(sessionId, session);
    setSessionCookie(res, sessionId);

    // Expose only the logical user identity to the client, not the session id.
    const responseUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    };

    res.json({ user: responseUser });
  } catch (err) {
    console.error('Error during login', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Return the currently authenticated user based on the session cookie.
app.get('/auth/me', (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const responseUser = {
    id: session.userId,
    name: session.name,
    username: session.username,
    role: session.role,
  };
  res.json({ user: responseUser });
});

// Logout: clear the session and cookie.
app.post('/auth/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SESSION_COOKIE_NAME];
  if (sid) {
    sessions.delete(sid);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

// Upsert a user by id; if id is omitted a new UUID is generated.
app.post('/user', async (req, res) => {
  const { id, name } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Missing or invalid name' });
    return;
  }

  const userId: string = typeof id === 'string' && id.length > 0 ? id : randomUUID();

  try {
    const sql =
      'INSERT INTO users (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name RETURNING id, name';
    const result = await query<{ id: string; name: string }>(sql, [userId, name]);
    const user = result.rows[0];
    res.json({ user });
  } catch (err) {
    console.error('Error upserting user', err);
    res.status(500).json({ error: 'Failed to upsert user' });
  }
});

// Get a single user by id.
app.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await query<{ id: string; name: string }>('SELECT id, name FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// List all cars for a given user.
app.get('/user/:userId/cars', async (req, res) => {
  const userId = req.params.userId;
  try {
    const sql =
      'SELECT id, user_id as "userId", name, color, acceleration, top_speed as "topSpeed", handling, created_at as "createdAt" FROM cars WHERE user_id = $1 ORDER BY created_at ASC';
    const result = await query<{
      id: string;
      userId: string;
      name: string;
      color: string;
      acceleration: number;
      topSpeed: number;
      handling: number;
      createdAt: string;
    }>(sql, [userId]);
    res.json({ cars: result.rows });
  } catch (err) {
    console.error('Error fetching user cars', err);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// Create a new car for a given user.
app.post('/user/:userId/cars', async (req, res) => {
  const userId = req.params.userId;
  const { name, color, acceleration, topSpeed, handling } = req.body ?? {};

  if (!name || typeof name !== 'string' || !color || typeof color !== 'string') {
    res.status(400).json({ error: 'Missing or invalid name/color' });
    return;
  }

  const acc = Number(acceleration);
  const top = Number(topSpeed);
  const hand = Number(handling);

  if (!Number.isFinite(acc) || !Number.isFinite(top) || !Number.isFinite(hand)) {
    res.status(400).json({ error: 'Invalid acceleration/topSpeed/handling' });
    return;
  }

  const carId = randomUUID();

  try {
    const sql =
      'INSERT INTO cars (id, user_id, name, color, acceleration, top_speed, handling) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, user_id as "userId", name, color, acceleration, top_speed as "topSpeed", handling, created_at as "createdAt"';
    const result = await query<{
      id: string;
      userId: string;
      name: string;
      color: string;
      acceleration: number;
      topSpeed: number;
      handling: number;
      createdAt: string;
    }>(sql, [carId, userId, name, color, acc, top, hand]);
    res.status(201).json({ car: result.rows[0] });
  } catch (err) {
    console.error('Error creating car', err);
    res.status(500).json({ error: 'Failed to create car' });
  }
});

// --- Additional admin endpoints for Postgres-backed data ---

// List all users.
app.get('/admin/users', async (_req, res) => {
  try {
    const result = await query<{ id: string; name: string }>('SELECT id, name FROM users ORDER BY name ASC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// List all cars for all users (admin view).
app.get('/admin/cars', async (_req, res) => {
  try {
    const sql =
      'SELECT id, user_id as "userId", name, color, acceleration, top_speed as "topSpeed", handling, created_at as "createdAt" FROM cars ORDER BY created_at DESC';
    const result = await query<{
      id: string;
      userId: string;
      name: string;
      color: string;
      acceleration: number;
      topSpeed: number;
      handling: number;
      createdAt: string;
    }>(sql, []);
    res.json({ cars: result.rows });
  } catch (err) {
    console.error('Error fetching all cars', err);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});
