# Next Session Start Guide

## Current State
- **Backend:** 100% Core Features Complete (Auth, Cars, Shop, Equipment, Auctions, Races, Replays).
- **Database:** PostgreSQL schema defined, Indexed, Dockerized.
- **Testing:** 22/22 Unit tests passing (`npm test`).
- **Postman:** `backend/racing-app.postman_collection.json` ready for manual API validation.
- **Documentation:** Updated `GEMINI.md` mandates for documentation sync and mandatory git commits.
- **Git:** Initial commit completed (59 files staged and committed).
- **Security:** Global Rate Limiting implemented in Backend.
- **API:** Implemented `/v1` versioning for all routes. Postman collection updated.

## Immediate Next Task: Flutter Implementation
Flutter CLI is not installed on the system. Flutter project initialization in the `frontend` directory needs to be performed on a machine with Flutter installed.

### 1. Flutter Setup (User Side)
Ensure `flutter` is installed and run `flutter create --platforms web,android,ios .` in the `frontend` directory.

### 2. Core Frontend Modules to Build:
- **`AuthService`**: Integration with NestJS `/auth/login` and `/auth/register`.
- **`RacingPainter`**: Use the pre-computed frames from the backend to draw car movement on a canvas.
- **`SocketService`**: Handshake with the backend for real-time `raceFrame` events.
- **`Dashboard`**: Garage view (Car list) and Marketplace view (Shop/Auction House).

### 3. Verification
Run the backend with `docker-compose up -d` and `npm run start:dev` to test the frontend integration.
