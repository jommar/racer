# Project Progress Tracking

## ✅ Completed (Backend & Architecture)
- **Infrastructure:**
    - Project structure (Frontend/Backend folders).
    - Docker-compose for PostgreSQL.
    - NestJS scaffolding with TypeScript.
    - Global Exception Filters & Logging Interceptors.
    - Database Indexing for performance.
    - Health Check endpoint.
- **Authentication:**
    - Email/Password Registration & Login.
    - JWT-based authentication.
    - Role-based Access Control (User, Admin, Superadmin).
    - Superadmin auto-seeding from `.env`.
- **Car & Equipment Management:**
    - Shop system for limited-time car/item availability.
    - Garage system (User inventory).
    - "One free car" logic for new users.
    - Equipment slot logic (Engine, Tires, Body, Nitro).
    - Item equipping/unequipping with stat snapshots.
- **Auction House:**
    - Atomic transactions for listing and buying items.
    - Instant trade logic with currency exchange.
    - Duplication prevention (items removed from inventory when listed).
- **Race Mechanics:**
    - Tick-based probabilistic winning formula.
    - Track length to Frame conversion logic.
    - Participant stat snapshotting (Audit-ready).
    - Compressed frame storage for replays.
    - Real-time streaming logic via WebSockets (Gateways).
- **Testing & Tooling:**
    - Unit tests for Auth, Cars, Auctions, and Races services.
    - Postman Collection (`backend/racing-app.postman_collection.json`) for manual API testing.
    - Detailed cURL documentation for core flows.
- **Documentation & Mandates:**
    - Updated AI Agent Mandates in `GEMINI.md` to require documentation sync after every task.
    - Created root `.gitignore` file for first commit.
    - Performed initial repository commit with 59 files.
- **Security & Performance:**
    - Global Rate Limiting (10 requests per minute) implemented using `@nestjs/throttler`.

## ⏳ In Progress / Not Done
- **Frontend (Flutter):**
    - Project initialization (Blocked: Flutter CLI not installed on this system).
    - Real-time track visualization using `CustomPainter`.
    - User Dashboard (Garage & Customization).
    - Admin Dashboard (Race control & Asset creation).
    - Auction House UI.
- **Real-time Synchronization:**
    - Frontend-to-Backend Socket.io handshake and event handling.
- **Advanced Logic:**
    - Auction House notifications (Real-time alerts when item sold).
    - Automatic Race Scheduling (Background cron jobs for scheduled starts).

## 🔍 For Refinement
- **Race Formula Balance:** Testing the probabilistic weights to ensure "puncher's chance" for base cars feels fair.
- **Auction House Search:** Adding filters for stats (e.g., "Show only engines with speed > 5").
- **Asset Management:** Refining how admins pick from "templates" (dynamic asset mapping).
- **Security:** Implementing Refresh Tokens.
