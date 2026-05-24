import { pool } from "../db/index";
import type { AuthUser } from "../types/express";

interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
}

export async function findOrCreateUserByGoogle(
  profile: GoogleProfile
): Promise<AuthUser> {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value ?? `${googleId}@google.oauth`;
  const username = profile.displayName || email.split("@")[0];

  const { rows: existing } = await pool.query<AuthUser>(
    `SELECT id, google_id, username, email FROM users WHERE google_id = $1`,
    [googleId]
  );

  if (existing.length > 0) {
    return existing[0];
  }

  const { rows: created } = await pool.query<AuthUser>(
    `INSERT INTO users (google_id, email, username)
     VALUES ($1, $2, $3)
     RETURNING id, google_id, username, email`,
    [googleId, email, username]
  );

  return created[0];
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const { rows } = await pool.query<AuthUser>(
    `SELECT id, google_id, username, email FROM users WHERE id = $1`,
    [id]
  );

  return rows[0] ?? null;
}
