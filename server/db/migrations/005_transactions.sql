-- psql "$DATABASE_URL" -f server/db/migrations/005_transactions.sql

CREATE TABLE transactions (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id),
  amount           NUMERIC(10,2) NOT NULL,
  merchant         VARCHAR(255),
  system_category  VARCHAR(20) CHECK (system_category IN ('FIXED_BILL','DISCRETIONARY')),
  is_violation     BOOLEAN DEFAULT FALSE,
  processed_at     TIMESTAMP DEFAULT NOW()
);
