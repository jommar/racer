---
name: racing-app-expert
description: Specialized guidance for building a drag racing web app with NestJS, Flutter, and PostgreSQL. Use when implementing race logic, managing the Auction House, or developing real-time features.
---

# Racing App Expert

This skill provides the architectural blueprints and domain-specific logic for the Racing Web App.

## Core Workflows

### 1. Implementing the Race Logic & Replays
Use the tick-based probability formula to determine race outcomes and store frames for replays.
- **Reference**: See [references/race-logic.md](references/race-logic.md) for the formula, pre-computation, and replay strategy.
- **Goal**: Ensure every race is recorded with its exact movements for transparency and audit purposes.
- **Audit**: Store snapshots of car stats at the start of each race to verify results later. See [references/data-models.md](references/data-models.md).

### 2. Building the Backend (NestJS)
- **Database**: PostgreSQL with transactional integrity for Auction House, performance indexing on key entities, and compressed storage (Bytea) for race frames.
- **Real-time**: Implement NestJS Gateways for live race streaming and instant marketplace updates.
- **Robustness**: 
    - Use Global Exception Filters for standardized errors.
    - Use Interceptors for performance logging.
    - Enforce strict DTO validation using `class-validator`.
    - Provide a health check endpoint for system monitoring.

### 3. Developing the Frontend (Flutter)
- **Track Rendering**: Reusable `CustomPainter` that can handle both live WebSocket streams and replayed frame data from REST APIs.
- **Auto-Zoom**: Implement scaling to fit unlimited participants.
- **Assets**: Use [assets/car.svg](assets/car.svg) for car rendering.

### 4. Admin and Roles
- **Superadmin**: Managed via `.env` / Config. Only one can exist; they can create other Admins.
- **Admin**: Can create items/cars from templates and manage race lifecycle (Create, Stop, Start).

## Security & Performance
- **Item Listing**: Always remove an item from the user's "Garage" view when it is listed in the Auction House.
- **High Concurrency**: The backend must compute race frames efficiently. For hundreds of cars, consider using worker threads or pre-computing the entire race before the stream starts.
