# Racing App Data Models (PostgreSQL)

## Core Tables

### users
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password_hash`: String
- `role`: Enum ('USER', 'ADMIN', 'SUPERADMIN')
- `currency`: Integer (Default 0)
- `created_at`: Timestamp

### cars
- `id`: UUID (Primary Key)
- `owner_id`: UUID (Foreign Key to `users`)
- `template_id`: String (Reference to asset template)
- `color`: String (HEX code)
- `is_free`: Boolean (Default false)
- `is_listed`: Boolean (Default false, for Auction House)

### equipment
- `id`: UUID (Primary Key)
- `owner_id`: UUID (Foreign Key to `users`)
- `type`: Enum ('ENGINE', 'TIRES', 'BODY', 'NITRO')
- `stats`: JSONB (e.g., `{ "speed": 5, "acceleration": 2 }`)
- `is_equipped`: Boolean
- `car_id`: UUID (Foreign Key to `cars`, Nullable)
- `is_listed`: Boolean (Default false)

### auctions
- `id`: UUID (Primary Key)
- `seller_id`: UUID (Foreign Key to `users`)
- `item_type`: Enum ('CAR', 'EQUIPMENT')
- `item_id`: UUID (Foreign Key to `cars` or `equipment`)
- `price`: Integer
- `created_at`: Timestamp

### races
- `id`: UUID (Primary Key)
- `admin_id`: UUID (Foreign Key to `users`)
- `track_length`: Integer
- `reward`: JSONB (e.g., `{ "currency": 500, "item_template_id": "engine_v1" }`)
- `status`: Enum ('PENDING', 'RUNNING', 'COMPLETED')
- `start_at`: Timestamp (Nullable, for scheduled starts)

### race_participants (Snapshots for Audit)
- `race_id`: UUID (Foreign Key to `races`)
- `car_id`: UUID (Foreign Key to `cars`)
- `owner_id`: UUID (Foreign Key to `users`)
- `stats_at_race_start`: JSONB (Snapshot of car stats to ensure audit integrity)

### race_frames (Replay Storage)
- `race_id`: UUID (Foreign Key to `races`)
- `compressed_frames`: Bytea (Gzipped JSON of all frame/tick data)
- `total_ticks`: Integer
- `final_results`: JSONB (Final rank list for quick lookups)

## Integrity Rules (Atomic Transactions)
- **Listing:** When an item is listed in `auctions`, `is_listed` must be set to `true` on the car/equipment record.
- **Buying:**
    1. Check buyer's `currency >= auction.price`.
    2. Deduct currency from buyer.
    3. Add currency to seller.
    4. Update `owner_id` of the car/equipment.
    5. Set `is_listed` to `false`.
    6. Delete or mark `auction` as completed.
    7. *All steps must occur within a single SQL transaction.*
