import type { User as SupabaseUser } from "@supabase/supabase-js";
import { pool } from "../db/index";
import type { AuthUser } from "../types/express";

const USER_COLUMNS =
  "id, supabase_id, google_id, username, email, onboarding_complete";

function deriveUsername(supabaseUser: SupabaseUser): string {
  const meta = supabaseUser.user_metadata as Record<string, unknown> | undefined;
  const fullName = meta?.full_name ?? meta?.name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName.trim();
  }
  const email = supabaseUser.email ?? "user@budgt.hero";
  return email.split("@")[0];
}

function deriveGoogleId(supabaseUser: SupabaseUser): string | null {
  const googleIdentity = supabaseUser.identities?.find(
    (identity) => identity.provider === "google"
  );
  return googleIdentity?.id ?? null;
}

export async function ensureAppUser(
  supabaseUser: SupabaseUser
): Promise<AuthUser> {
  const supabaseId = supabaseUser.id;
  const email = supabaseUser.email ?? `${supabaseId}@supabase.auth`;
  const username = deriveUsername(supabaseUser);
  const googleId = deriveGoogleId(supabaseUser);

  const { rows: bySupabaseId } = await pool.query<AuthUser>(
    `SELECT ${USER_COLUMNS} FROM users WHERE supabase_id = $1`,
    [supabaseId]
  );
  if (bySupabaseId.length > 0) {
    return bySupabaseId[0];
  }

  const { rows: byEmail } = await pool.query<AuthUser>(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
    [email]
  );
  if (byEmail.length > 0) {
    const { rows: linked } = await pool.query<AuthUser>(
      `UPDATE users
       SET supabase_id = $1,
           google_id = COALESCE(google_id, $2)
       WHERE id = $3
       RETURNING ${USER_COLUMNS}`,
      [supabaseId, googleId, byEmail[0].id]
    );
    return linked[0];
  }

  const { rows: created } = await pool.query<AuthUser>(
    `INSERT INTO users (supabase_id, google_id, email, username)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`,
    [supabaseId, googleId, email, username]
  );

  return created[0];
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const { rows } = await pool.query<AuthUser>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );

  return rows[0] ?? null;
}
