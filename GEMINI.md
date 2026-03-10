# NitroDash Foundational Mandates

## 📜 Core Mandates (MUST FOLLOW)
1.  **Context Efficiency:** Always read `GEMINI.md` and `LOG.md` at the start of a session.
2.  **Documentation Sync:** After **EVERY** task, you MUST update the `LOG.md` file (Progress, Tasks, and Next Steps).
3.  **Component Reusability:** Use/Expand components in `src/components/ui/core.tsx`. Refer to the Library section below.
4.  **Testing:** Backend features require `npm test` verification.
5.  **Version Control:** Commit with a descriptive message after every task and doc sync.

---

## 🛠️ Architectural & Domain Constraints
- **Stack:** NestJS (Port 4000), React + Vite (Port 5174), PostgreSQL (Port 5433).
- **Real-time:** Socket.io for live racing; Canvas for rendering.
- **Race Logic:** Outcomes are determined by a tick-based probabilistic formula (Base Stats + Random Weight).
- **Inventory Rule:** Items listed in the Auction House **MUST NOT** appear in the player's Garage inventory.
- **Atomic Ops:** All Marketplace/Auction trades MUST use database transactions.

---

## 🎨 Component Library Reference
- **`Button`**: `primary`, `secondary`, `outline`, `ghost`, `danger`.
- **`Card`**: Glassmorphic container with `glass` and `hover` toggles.
- **`Input`**: Icon-supported with `error` validation states.
- **`StatsProgress`**: Bars with `potential` boost visualization.
- **`Modal`**: Animated overlay for critical actions.
- **`Tabs`**: Segmented control for switching sub-views.

---

## 🔧 Development Workflow
- **Backend Start:** `cd backend && npm run start:dev` (Automatically clears port 4000).
- **Frontend Start:** `cd frontend && npm run dev` (Runs on 5174).
- **DB Setup:** Run `./setup-db.sh` to reset the PostgreSQL environment.
