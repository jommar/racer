# Racing Arena

A small real-time racing simulator where you can add any number of cars, configure a track "size" (duration), and watch them race in a modern UI. All race logic runs on a Node.js + TypeScript backend, and the frontend connects over Socket.IO.

## Tech Stack

- **Backend**: Node.js 20 (via .nvmrc), TypeScript, Express, Socket.IO
- **Frontend**: React + Vite, Socket.IO client
- **Data**: In-memory race state only. The frontend uses `localStorage` to remember cars and duration.

## Project Structure

- `backend/` – Express + Socket.IO server and race simulation logic
- `frontend/` – React + Vite frontend and Socket.IO client
- `ARCHITECTURE.md` – Detailed architecture, event flow, and behavior

## Prerequisites

- Node.js 20 (recommended to use `nvm` and the provided `.nvmrc`)
- npm (comes with Node)

From the project root:

```bash
# Use the project Node version (if you use nvm)
nvm use
```

## Backend: Development

```bash
cd backend
npm install
npm run dev
```

- Starts the backend on http://localhost:4000
- Exposes a simple health check at `/`
- Serves a Socket.IO server for the frontend

## Frontend: Development

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

- Starts Vite dev server (by default on http://localhost:5173)
- The app connects to the backend via Socket.IO

Open the frontend URL in your browser to use the app.

## How It Works (High-Level)

- Add cars with attributes (acceleration, top speed, handling).
- Set a race duration in seconds (acts like track size; the frontend enforces a 5s minimum by default).
- Start the race:
  - Backend computes per-car performance scores.
  - Every ~200 ms, backend advances each car's progress and emits `race:tick` updates.
  - Each car runs independently until its progress reaches 1.0; its finish time is recorded.
  - When all cars finish, the backend emits `race:finished` with full results (finish time, final speed, rank for every car).
- Frontend shows:
  - Garage list of cars
  - Live race monitor & modal with animated SVG cars
  - A full results table and a winners (top 3) section

For more details about the events and data structures, see `ARCHITECTURE.md`.
