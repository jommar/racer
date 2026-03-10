# Racing Web App - Drag Race Edition

A full-stack drag racing web application where users can collect, upgrade, and race cars in admin-hosted events.

## Project Structure
- `/frontend`: Flutter (Web & Mobile).
- `/backend`: Node.js (NestJS).

## Core Mechanics
- **Type:** Virtual Drag Racing (Visualized on a track).
- **Participants:** Support for an unlimited number of cars per race run (no collision/overlapping allowed).
- **Car Stats (Base Stats = 1):**
    - **Speed:** Increases the probability of moving forward in a frame.
    - **Acceleration:** Higher probability of moving forward in the first 25% of the race.
    - **Top Speed:** Higher probability of moving forward in the last 25% of the race.
    - **Grip/Consistency:** Reduces the chance of a "missed" frame (0 movement).
- **Customization:** Beyond stats, cars have visual properties (e.g., color) that can be modified.
- **Equipment Slots (Modular):** Engine, Tires, Body, Nitro.
- **Currency:** Single unified currency for Shop, Auction House, and Race Rewards.

## Authentication & Roles
- **Auth Method:** Email/Password.
- **Roles:**
    - **Superadmin:** Defined in `.env`. Manages Admins and can delete accounts.
    - **Admin:** Creates assets (from templates), manages races, and removes participants.
    - **User:** Owns cars, trades in the Auction House, and participates in races.

## Real-time Dashboards & Market
- **Real-time Sync:** All dashboards (Garage, Shop, Auction House) update instantly via WebSockets (Socket.io).
- **Shop:** Admins create cars/equipment with a set availability duration.
- **Free Entry:** New users claim one base car for free.
- **Auction House:** 
    - Instant trades with atomic database transactions.
    - Items are removed from user inventory upon listing to prevent duplication.

## Race Execution & Logic
- **Track Length:** Determined by Admin (e.g., Input 10 = 1,000 Total Frames/Ticks).
- **Communication:** WebSockets for real-time streaming of pre-computed frames.
- **Visualization:** 
    - Auto-zooming top-down view to fit all participants.
    - SVG-based car assets for scalability.
- **Race Replay & Audit:**
    - All races are recorded frame-by-frame.
    - **Replay:** Users and Admins can replay any past race with the exact same movements.
    - **Auditing:** Admins can review replays to verify results or investigate disputes.
- **Race Scheduling:** Manual start or scheduled timer by Admin.
- **Rewards:** Assigned by Admin during race creation.

## Technical Requirements
- **Frontend:** Flutter (Web primary, responsive for Mobile).
- **Backend:** NestJS (Node.js).
- **Database:** PostgreSQL (Transactional integrity + Performance Indexing).
- **Real-time:** Socket.io (NestJS Gateways).
- **Robustness:** 
    - Global Exception Filters & Logging Interceptors.
    - Strict DTO Validation (`class-validator`).
    - Health Check endpoint (`/health`).
    - Unit Tests for core business logic.

## Testing the Backend
### Automated Tests
Run unit tests for core services:
```bash
cd backend
npm test
```

### Manual Testing
1. **Start DB:** `docker-compose up -d`
2. **Start Server:** `cd backend && npm run start:dev`
3. **Postman:** Import `backend/racing-app.postman_collection.json` into Postman.
4. **cURL:** See the project documentation for a full list of cURL commands.
