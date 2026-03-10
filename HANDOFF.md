# Handoff: NitroDash Development

## Current State
- **Architecture:** Project successfully migrated to React (Vite) for better web-native performance. Backend is NestJS + PostgreSQL.
- **Port Mapping:** 
  - Backend: `4000`
  - Frontend: `5174`
  - Database: `5433`
- **Integration:** Auth and Dashboard are fully connected to real data. The system automatically handles port conflicts and stale tokens.
- **Components:** A reusable library exists in `src/components/ui/core.tsx` and is documented in `frontend/COMPONENTS.md`.

## Immediate Next Steps
1.  **Garage UI:** Implement the inventory view where users can see their cars and equip parts. This should use the `Tabs`, `StatsProgress`, and `Modal` components.
2.  **Real-time Races:** Connect the existing `RaceTrack` canvas to the `RacesGateway` via Socket.io to visualize actual backend race ticks.
3.  **Marketplace:** Build the Shop UI to allow users to spend their starting currency.

## Critical Notes
- Use `npm run start:dev` in the backend; it now includes an automatic port-clearing hook.
- When adding new components, update `frontend/COMPONENTS.md`.
- All API calls should use the `api` service in `frontend/src/services/api.ts` to ensure token handling and 401 redirects.
