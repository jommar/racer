# Racing App Agent Mandates

This file contains absolute mandates for any AI agent working on this project.

## Core Rules
1. **Context Efficiency:** Before starting any task, read `PROGRESS.md` and `HANDOFF.md`.
2. **Skill Usage:** Always activate the `racing-app-expert` skill at the start of a session using `activate_skill`.
3. **Documentation Sync:** After every significant code change or feature completion, you **MUST** update `PROGRESS.md`.
4. **Handoff Management:** If a session is ending or a major milestone is reached, update `HANDOFF.md` with the "Next Steps" and current blocker status.
5. **Testing:** Never consider a backend feature complete without running `npm test` in the `backend` directory.

## Architectural Constraints
- **Backend:** NestJS with PostgreSQL. Use Atomic Transactions for all Auction/Marketplace logic.
- **Frontend:** Flutter (Web/Mobile). Use `CustomPainter` for the race track.
- **Real-time:** Socket.io via NestJS Gateways.
