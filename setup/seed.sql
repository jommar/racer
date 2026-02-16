-- Schema for testing
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL
);

-- Ensure auth-related columns exist (idempotent for repeated seeds)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  acceleration REAL NOT NULL,
  top_speed REAL NOT NULL,
  handling REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Races created in the system. These can be live (active in memory)
-- or historical (past races that no longer exist in memory).
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY,
  created_by UUID NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'idle',
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ NULL
);

-- Sample users (including admins)
INSERT INTO users (id, name, username, password, role) VALUES
  -- Admin accounts
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin', 'admin123', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Race Admin', 'raceadmin', 'raceadmin123', 'admin'),
  -- Regular users
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'alice', 'alice123', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'Bob', 'bob', 'bob123', 'user')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role;

-- Sample cars
INSERT INTO cars (id, user_id, name, color, acceleration, top_speed, handling)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Alice GT', '#ef4444', 6.5, 220, 0.8),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Alice Drift', '#3b82f6', 7.5, 210, 0.9),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Bob Cruiser', '#22c55e', 5.0, 200, 0.7)
ON CONFLICT (id) DO NOTHING;

-- No static seed data for races; they will be created at runtime
-- and persisted from the backend when admins create live races.
