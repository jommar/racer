import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { RaceManager, RaceState, Car, RaceTick } from './race';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 4000;

const raceManager = new RaceManager();

/**
 * Broadcast the current race state to all connected clients.
 *
 * This is used after configuration changes and terminal events
 * (start, finish, reset) so the frontend can stay in sync.
 */
function emitRaceState() {
  const state: RaceState = raceManager.getState();
  io.emit('race:state', state);
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('server:welcome', { message: 'Welcome to the racing backend' });
  socket.emit('race:state', raceManager.getState());

  /**
   * Configure the race duration in milliseconds.
   */
  socket.on('race:configure', (payload: { durationMs: number }) => {
    const duration = Number(payload?.durationMs) || 10000;
    raceManager.configure(duration);
    emitRaceState();
  });

  /**
   * Add a new car to the current race lobby.
   */
  socket.on('car:add', (payload: Car) => {
    if (!payload || !payload.id || !payload.name || !payload.color) {
      return;
    }
    raceManager.addCar(payload);
    emitRaceState();
  });

  /**
   * Start the race using the current cars and configured duration.
   */
  socket.on('race:start', () => {
    const started = raceManager.start(
      (tick: RaceTick[]) => {
        if (tick && tick.length > 0) {
          io.emit('race:tick', { tick });
        }
      },
      (results, state) => {
        io.emit('race:finished', { results, state });
        emitRaceState();
      },
    );
    if (started) {
      io.emit('race:started', {
        startedAt: Date.now(),
        durationMs: raceManager.getState().durationMs,
      });
    }
  });

  /**
   * Reset the race back to an idle, empty state.
   */
  socket.on('race:reset', () => {
    raceManager.clear();
    emitRaceState();
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
  res.header('Access-Control-Allow-Origin', '*');
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
        startedAt?: number;
        finishedAt?: number;
      };
      return {
        file,
        raceId: parsed.raceId ?? file.replace(/\.json$/, ''),
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
  res.header('Access-Control-Allow-Origin', '*');
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
