-- Character and onboarding columns for PRD v2 Phase 12.
-- psql "$DATABASE_URL" -f server/db/migrations/013_character.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS budgteer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_config JSONB,
  ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date DATE;
