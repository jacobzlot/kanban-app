-- Kanban Board Schema
-- Run this once to set up your database

CREATE TABLE IF NOT EXISTS columns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(7) DEFAULT '#6366f1',
  card_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  column_id INTEGER REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  priority VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, critical
  progress INTEGER DEFAULT 0,             -- 0–100
  status VARCHAR(20) DEFAULT 'active',    -- active, done
  tags TEXT DEFAULT '',                   -- comma-separated tag names
  tag_colors TEXT DEFAULT '',             -- comma-separated hex colors matching tags
  start_date DATE DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed with default columns
INSERT INTO columns (title, position, color) VALUES
  ('Ideas', 0, '#f59e0b'),
  ('Research', 1, '#10b981'),
  ('In Progress', 2, '#6366f1'),
  ('Review', 3, '#f97316'),
  ('Done', 4, '#22c55e')
ON CONFLICT DO NOTHING;
