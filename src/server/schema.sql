-- open-trainer — Personal Training & Coaching Platform
-- Clients + exercise library + workout builder + scheduling + payments.
-- Primary keys are UUIDs (TEXT) — non-enumerable, safe to expose in URLs/share links.

-- ── Clients (trainees / coaching clients) ──────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',       -- active | inactive
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ── Exercise library (seeded reference catalogue, read-mostly) ──────
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL DEFAULT '',           -- stable natural key from the source dataset
  name TEXT NOT NULL,
  body_part TEXT NOT NULL DEFAULT '',
  target TEXT NOT NULL DEFAULT '',
  equipment TEXT NOT NULL DEFAULT '',
  secondary_muscles TEXT NOT NULL DEFAULT '[]', -- JSON array
  instructions TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',                -- path within free-exercise-db (e.g. "Barbell_Squat/0.jpg")
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_source ON exercises(source_id);

-- ── Workout templates / programs (reusable) ────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  share_token TEXT NOT NULL DEFAULT '',         -- random UUID when shared publicly, '' when private
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ── Exercises inside a workout (ordered, with prescription) ────────
CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  notes TEXT DEFAULT ''
);

-- ── Sessions: scheduled sessions & assigned workouts (the calendar) ─
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  workout_id TEXT REFERENCES workouts(id) ON DELETE SET NULL,
  title TEXT DEFAULT '',
  session_type TEXT NOT NULL DEFAULT 'session', -- session | program | consult | assessment
  scheduled_date TEXT NOT NULL DEFAULT (date('now')),
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',      -- scheduled | completed | cancelled | no_show
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ── Payments ledger ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount REAL NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  method TEXT DEFAULT '',                        -- cash | card | transfer
  status TEXT NOT NULL DEFAULT 'paid',           -- paid | pending
  paid_date TEXT DEFAULT (date('now')),
  created_at TEXT DEFAULT (datetime('now'))
);
-- Seed data lives in the app, not here.
--
-- A Clawnify deploy applies this file as DDL only: it accepts CREATE TABLE /
-- INDEX / VIEW / TRIGGER and ALTER TABLE ... ADD COLUMN, and a single INSERT
-- fails the entire deploy. The exercise library (873 rows, from
-- github.com/yuhonas/free-exercise-db) moved to src/server/seed-exercises.ts and
-- the example clients/workouts/sessions/payments to src/server/seed-demo.ts;
-- ensureSeeded() in src/server/index.ts writes them on the first request.

-- ── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_exercises_body_part ON exercises(body_part);
CREATE INDEX IF NOT EXISTS idx_exercises_target ON exercises(target);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_share_token ON workouts(share_token) WHERE share_token != '';
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
