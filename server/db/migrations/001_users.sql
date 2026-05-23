-- Run migrations in order against Supabase (psql or SQL Editor):
-- psql "$DATABASE_URL" -f server/db/migrations/001_users.sql

CREATE TABLE users (
  id                        SERIAL PRIMARY KEY,
  google_id                 VARCHAR(255) UNIQUE NOT NULL,
  username                  VARCHAR(255) NOT NULL,
  email                     VARCHAR(255) UNIQUE NOT NULL,
  playable_balance          NUMERIC(10,2) DEFAULT 0,
  current_xp                INTEGER DEFAULT 0,
  level                     INTEGER DEFAULT 1,
  wishlist_tokens_micro     INTEGER DEFAULT 0,
  wishlist_tokens_standard  INTEGER DEFAULT 0,
  state                     VARCHAR(20) DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE','GULAG','REDEMPTION')),
  current_season_id         INTEGER,
  created_at                TIMESTAMP DEFAULT NOW()
);
