PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS team_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  color_hex  TEXT    NOT NULL DEFAULT '#6366f1',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chores (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  assigned_to   INTEGER NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  start_date    TEXT    NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chore_instances (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id      INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  instance_date TEXT    NOT NULL,
  completed_at  TEXT,
  completed_by  INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
  UNIQUE (chore_id, instance_date)
);

CREATE INDEX IF NOT EXISTS idx_chores_start_date  ON chores(start_date);
CREATE INDEX IF NOT EXISTS idx_chores_assigned_to ON chores(assigned_to);
CREATE INDEX IF NOT EXISTS idx_instances_date     ON chore_instances(instance_date);
CREATE INDEX IF NOT EXISTS idx_instances_chore_id ON chore_instances(chore_id);
