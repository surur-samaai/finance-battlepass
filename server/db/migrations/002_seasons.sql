-- psql "$DATABASE_URL" -f server/db/migrations/002_seasons.sql

CREATE TABLE seasons (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id),
  season_number  INTEGER NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE,
  final_xp       INTEGER,
  final_level    INTEGER,
  final_tokens   INTEGER
);
