-- psql "$DATABASE_URL" -f server/db/migrations/003_quests.sql

CREATE TABLE quests (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  title         VARCHAR(255) NOT NULL,
  xp_reward     INTEGER NOT NULL,
  quest_type    VARCHAR(30) CHECK (quest_type IN ('DAILY','WEEKLY','GULAG_REDEMPTION')),
  status        VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETE','FAILED')),
  streak_count  INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);
