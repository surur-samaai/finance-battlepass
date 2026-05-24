import { pool } from "../db/index";
import type { SeasonSummary } from "../types/seasonReset";

function formatDate(value: Date | string | null): string {
  if (value === null) return "";
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export async function getSeasonHistory(userId: number): Promise<SeasonSummary[]> {
  const { rows } = await pool.query<{
    id: number;
    season_number: number;
    start_date: Date | string;
    end_date: Date | string | null;
    final_xp: number | null;
    final_level: number | null;
    final_tokens: number | null;
  }>(
    `SELECT id, season_number, start_date, end_date, final_xp, final_level, final_tokens
     FROM seasons
     WHERE user_id = $1
     ORDER BY season_number DESC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    season_number: row.season_number,
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
    final_xp: row.final_xp ?? 0,
    final_level: row.final_level ?? 0,
    final_tokens: row.final_tokens ?? 0,
  }));
}
