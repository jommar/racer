# Drag Race Formula (Tick-Based Probability)

The outcome of each race is determined by a series of "ticks" (frames). For each tick, every car has a chance to move forward by a specific amount (e.g., 1 unit).

## Probability Formula

The probability ($P$) of a car moving forward in a single tick is:

$$P = \frac{Stat\_Total}{Stat\_Total + K}$$

Where:
- **Stat_Total**: The sum of the car's relevant stats (Speed, Acceleration, Top Speed, Grip).
- **K**: A constant (e.g., 50) that determines the "difficulty" or the baseline for movement.

### Sub-Factors (Optional/Suggested)
- **Early Phase (0-25%):** `Acceleration` stat has a 2x weight.
- **Mid Phase (25-75%):** `Speed` stat has a 2x weight.
- **Late Phase (75-100%):** `Top Speed` stat has a 2x weight.
- **Consistency Roll:** Before the move roll, check `Grip`. If a `Random(0, 100) > Grip`, the car misses the frame (0 movement).

## Pre-Computation & Persistence Strategy
The backend computes all frames for the entire race duration *before* or *immediately after* the race starts to ensure synchronization across all clients via Socket.io.

### Frame Recording (Replay & Audit)
To support replays and auditing, every race's frame sequence must be persisted in a compressed format (e.g., Gzipped JSON) in the database.
1. **Live Stream**: Frames are emitted via Socket.io in real-time.
2. **Replay Mode**: The frontend requests the race's `frames` JSON from the REST API and plays them sequentially at the original speed.
3. **Immutability**: Once a race is completed, its frame data cannot be altered, serving as a permanent audit trail.
