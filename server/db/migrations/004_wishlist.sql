-- psql "$DATABASE_URL" -f server/db/migrations/004_wishlist.sql

CREATE TABLE wishlist (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id),
  item_name    VARCHAR(255) NOT NULL,
  price_zar    NUMERIC(10,2),
  token_cost   INTEGER NOT NULL,
  token_type   VARCHAR(10) CHECK (token_type IN ('MICRO','STANDARD')),
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW()
);
