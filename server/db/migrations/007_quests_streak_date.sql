-- psql "$DATABASE_URL" -f server/db/migrations/007_quests_streak_date.sql

ALTER TABLE quests ADD COLUMN last_streak_date DATE;
