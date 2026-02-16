# Racing App Architecture

This document describes the **current**, working architecture of the racing app.

## Tech Stack

- **Backend**: Node.js (via .nvmrc), TypeScript, Express, Socket.IO
- **Frontend**: React + Vite (JavaScript), Socket.IO client
- **Data**: In-memory race state (single race at a time). No database; the frontend uses `localStorage` for persistence of setup only.

---

## High-Level Components

### Backend

- **RaceManager** (backend/src/race.ts)
  - Holds the in-memory race state: `cars`, `durationMs`, `status`, timestamps, and results.
  - Accepts new cars while the race is not running.
  - Configures the race duration.
  - Starts the race simulation and drives per-tick updates.
  - Clears the race back to an idle state.

- **Race Simulation**
  - Each car has attributes: `acceleration`, `topSpeed`, `handling`.
  - On race start, a performance `speedScore` is computed per car using these attributes and a bit of randomness.
  - The configured `durationMs` behaves like **map size / track length scale**:
    - Shorter duration → larger increments per tick → shorter race.
    - Longer duration → smaller increments per tick → longer race.
  - Every ~200ms, each car’s `progress` (0 → 1) is advanced based on its normalized `speedScore`.
  - Each car effectively runs "on its own" and is allowed to finish regardless of the configured timer.
  - When a car first reaches `progress >= 1`, its **finish time** is recorded as `finishTimeMs` (ms since race start).
  - The race ends **only after all cars have finished** (all progress values are 1).

- **Results Computation**
  - The backend builds a `RaceResult` for each car:
    - `carId`, `name`, `color`
    - `finalSpeed` (derived from the performance score)
    - `finishTimeMs` (time to finish)
    - `rank`
  - Results are ranked primarily by `finishTimeMs` (fastest time wins), with `finalSpeed` as a tie-breaker.
  - All cars get a result entry; the frontend can display the full table or just the top N.

- **Socket Server** (backend/src/server.ts)
  - Uses Socket.IO on top of an Express HTTP server.
  - On client connect:
    - Emits `server:welcome` (simple greeting).
    - Emits the current `race:state`.
  - Listens for race control events from clients and fans out state updates.

### Frontend

- **Single-page React app** (frontend/src/App.jsx)
  - Connects to the backend Socket.IO server.
  - Lets the user:
    - Add any number of cars with attributes.
    - Configure a race duration.
    - Start and reset races.
  - Stores the car list and duration in `localStorage` so they survive page reloads.
  - Shows:
    - A "Garage" list of cars.
    - A race monitor with live car positions and percentages.
    - A live race modal with the same info plus a winners section.
    - Final results for all cars.

---

## Event / Communication Flow

### 1. Client connects

- Frontend opens a Socket.IO connection to the backend.
- Backend responds with:
  - `server:welcome` → `{ message }` (informational)
  - `race:state` → current race state so the UI can hydrate.

### 2. Configure race & add cars

- From frontend → backend:
  - `race:configure` → `{ durationMs }`
    - User adjusts race duration via UI.
    - Backend updates `state.durationMs` and sets status to `ready` if it was `idle`.
  - `car:add` → `{ id, name, color, attributes }`
    - Adds a car to the race as long as the race is not running.

- From backend → frontend:
  - `race:state` → `{ cars, durationMs, status, results? }`
    - Emitted whenever cars or configuration change (and after race events) so UI stays in sync.

### 3. Start race

- From frontend → backend:
  - `race:start` → `{}`
    - Triggers the simulation using the current cars and configured duration.

- Backend behavior:
  - If start is accepted, the backend:
    - Switches state to `running` and records `startedAt`.
    - Starts a 200ms tick interval to advance each car’s progress.
    - Registers finish times as each car reaches the end.
    - When all cars finish, computes results and marks the race `finished`.

- From backend → frontend:
  - `race:started` → `{ startedAt, durationMs }`
    - Confirms race has started.
    - Frontend uses this to run a **countdown timer** based on `durationMs` (as a guide only; the actual race may run longer until all cars finish).
  - `race:tick` → `{ tick: RaceTick[] }`
    - Emitted roughly every 200ms with per-car progress updates.
    - Frontend uses `tick.progress` as the primary source of truth for car positions.
  - `race:finished` → `{ results, state }`
    - Emitted once all cars have finished.
    - Contains a full array of results for all cars, including `finishTimeMs` and `rank`.

### 4. Reset race

- From frontend → backend:
  - `race:reset` → `{}`
    - Clears the current race state and stops any ticking.

- From backend → frontend:
  - `race:state` → reset state (`cars: []`, `status: 'idle'`, existing `durationMs` preserved).

---

## Current MVP Behavior

- **Cars & Attributes**
  - User can add as many cars as desired.
  - Each car includes: `name`, `color` (randomly chosen on client), `acceleration`, `topSpeed`, `handling`.

- **Duration / Track Size**
  - User sets a duration in seconds via the frontend.
  - The frontend enforces a **minimum of 5 seconds** in the input for normal use.
  - That duration is sent as `durationMs` to the backend and influences how quickly the race completes (map size), but **does not forcibly stop the race**.

- **Race Progression**
  - Backend is authoritative:
    - It computes progress per car on each tick and emits `race:tick`.
  - Frontend:
    - Uses `race:tick` to animate car positions (with a mild time-based fallback while ticks are still coming in).
    - Shows both a race monitor and a live race modal with SVG car icons moving along a track.

- **Results & Finish Times**
  - All cars are allowed to finish; slower cars simply take more time.
  - For each car, the backend records `finishTimeMs` and computes a `finalSpeed` score.
  - Results are ranked by finish time (then by speed), and the frontend displays:
    - A full results list for all cars.
    - A winners section (top 3) in the live race modal.

---

## Future Ideas

- More realistic physics (explicit velocity & distance integration per tick).
- Support for multiple concurrent races using Socket.IO rooms.
- 3D or more advanced visualizations (e.g., three.js track view) driven by the same tick data.
- Optional persistence of race history using a database.
