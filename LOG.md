# NitroDash Project Log

## 📊 Current Status
Migration to React (Vite) is complete. Backend is integrated with a fresh PostgreSQL instance on Port 5433. The system is stable and using a custom component library.

---

## ✅ Completed Milestones
- **Infrastructure:** NestJS + PostgreSQL (Port 5433).
- **Auth:** JWT Auth with auto-redirect on 401. Unified `access_token` naming.
- **API:** Implemented `/v1/auth/profile`, `/v1/races` (Get All), and Race Logic.
- **Frontend:** Global racing theme, Canvas engine, Race Simulator (`/simulator`), and reusable Component Library.

---

## 📋 Task Backlog

| Task Description | Status | Last Worked | Notes |
| :--- | :--- | :--- | :--- |
| Build Race Simulator | ✅ Done | 2026-03-11 | Baseline tool at `/simulator`. |
| Build Component Library | ✅ Done | 2026-03-11 | Expanded with Modals & Stats. |
| Implement Auth & Sync | ✅ Done | 2026-03-11 | Integrated with NestJS. |
| Fix Race Data Model | ✅ Done | 2026-03-11 | Added `name` & relations. |
| Build Garage UI | ⏳ Active | 2026-03-11 | Car & Part management. |
| Socket.io Integration | 📅 Pending | - | Live race streaming. |
| Auction House UI | 📅 Pending | - | Marketplace implementation. |

---

## ⚠️ Known Conflicts & Resolutions
- **Port Conflicts:** Ports 3000, 3001, 8080, and 8081 are used by other local apps. Use **4000** (Backend) and **5174** (Frontend).
- **DB Auth Errors:** If "password authentication fails," run `./setup-db.sh` to clear old volumes.
- **Blank UI:** Ensure types are imported using `import type` and explicit paths (`../types/index`).

---

## 🏎️ Next Steps
1.  **Garage UI:** Implement the inventory view using `Tabs` and `StatsProgress`.
2.  **Live Race:** Connect `RaceTrack` canvas to backend gateway.
