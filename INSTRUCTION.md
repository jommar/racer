# NitroDash Project Instructions

## 🛠️ Architectural Constraints
- **Backend:** NestJS (Port 4000). Use Atomic Transactions for all Auction/Marketplace logic.
- **Frontend:** React + Vite (Port 5174). Use HTML5 Canvas for the race track.
- **Database:** PostgreSQL (Port 5433).
- **Real-time:** Socket.io via NestJS Gateways.

## 📜 Core Mandates (MUST FOLLOW)
1.  **Context Efficiency:** Always read `INSTRUCTION.md` and `LOG.md` at the start of a session.
2.  **Documentation Sync:** After **EVERY** task, you MUST update the `LOG.md` file (Progress, Tasks, and Next Steps).
3.  **Component Reusability:** Do not write raw Tailwind for common UI patterns. Use/Expand the components in `src/components/ui/core.tsx`.
4.  **Testing:** Backend features require `npm test` verification.
5.  **Version Control:** Perform a git commit with a descriptive message after every task and doc sync.

---

## 🎨 Component Library Reference
Detailed usage for `src/components/ui/core.tsx`:

- **`Button`**: Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`.
- **`Card`**: Standard glassmorphic container with `glass` and `hover` props.
- **`Input`**: Icon-supported text fields with validation `error` support.
- **`StatsProgress`**: Performance bars with `potential` boost visualization.
- **`Modal`**: Animated overlay for confirmations.
- **`Tabs`**: Segmented control for view switching.
- **`PageContainer`**: Standard layout wrapper with Navbar.

---

## 🔧 Development Workflow
- **Backend Start:** `cd backend && npm run start:dev` (Autokills port 4000).
- **Frontend Start:** `cd frontend && npm run dev`.
- **DB Setup:** Run `./setup-db.sh` to reset the PostgreSQL container and volumes.
