import { pool } from "../db/index";
import {
  STARTING_LEVEL,
  STARTING_XP,
} from "../constants/gameConfig";
import { seedDefaultQuests } from "./questSeedService";
import type { SeasonResetResult } from "../types/seasonReset";

export class SeasonResetError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "SeasonResetError";
  }
}

function formatDate(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export async function resetSeason(userId: number): Promise<SeasonResetResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: userRows } = await client.query<{
      current_xp: number;
      level: number;
      wishlist_tokens_micro: number;
      wishlist_tokens_standard: number;
      current_season_id: number | null;
      created_at: Date;
    }>(
      `SELECT current_xp, level, wishlist_tokens_micro, wishlist_tokens_standard,
              current_season_id, created_at
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (userRows.length === 0) {
      throw new SeasonResetError("User not found.", 404);
    }

    const user = userRows[0];
    const finalXp = user.current_xp;
    const finalLevel = user.level;
    const finalTokens =
      user.wishlist_tokens_micro + user.wishlist_tokens_standard;

    const { rows: seasonNumberRows } = await client.query<{ next_number: number }>(
      `SELECT COALESCE(MAX(season_number), 0) + 1 AS next_number
       FROM seasons
       WHERE user_id = $1`,
      [userId]
    );
    const seasonNumber = seasonNumberRows[0].next_number;

    let startDate: string;
    if (user.current_season_id !== null) {
      const { rows: priorSeasonRows } = await client.query<{ end_date: Date | string }>(
        `SELECT end_date FROM seasons WHERE id = $1`,
        [user.current_season_id]
      );
      if (priorSeasonRows.length === 0) {
        startDate = formatDate(user.created_at);
      } else {
        startDate = formatDate(priorSeasonRows[0].end_date);
      }
    } else {
      startDate = formatDate(user.created_at);
    }

    const { rows: archiveRows } = await client.query<{
      id: number;
      season_number: number;
    }>(
      `INSERT INTO seasons (
         user_id, season_number, start_date, end_date,
         final_xp, final_level, final_tokens
       )
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
       RETURNING id, season_number`,
      [userId, seasonNumber, startDate, finalXp, finalLevel, finalTokens]
    );

    const archivedSeason = archiveRows[0];

    await client.query(
      `UPDATE users SET
         current_xp = $2,
         level = $3,
         wishlist_tokens_micro = 0,
         wishlist_tokens_standard = 0,
         state = 'ACTIVE',
         current_season_id = $4
       WHERE id = $1`,
      [userId, STARTING_XP, STARTING_LEVEL, archivedSeason.id]
    );

    await client.query(
      `UPDATE wishlist SET is_purchased = false WHERE user_id = $1`,
      [userId]
    );

    await client.query(
      `UPDATE quests SET status = 'FAILED' WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId]
    );

    await seedDefaultQuests(client, userId);

    const { rows: newStartRows } = await client.query<{ today: Date }>(
      `SELECT CURRENT_DATE AS today`
    );
    const newSeasonStartDate = formatDate(newStartRows[0].today);

    await client.query("COMMIT");

    return {
      success: true,
      archivedSeasonId: archivedSeason.id,
      seasonNumber: archivedSeason.season_number,
      newSeasonStartDate,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
