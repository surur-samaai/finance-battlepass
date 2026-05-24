import { pool } from "../db/index";
import { XP_LEVEL_THRESHOLDS, SEASON_MAX_XP, MAX_LEVEL } from "../constants/gameConfig";
import type { QuestType } from "../constants/gameConfig";

interface DashboardUser {
  username: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  playable_balance: number;
  state: "ACTIVE" | "GULAG" | "REDEMPTION";
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
}

interface DashboardQuest {
  id: number;
  title: string;
  xp_reward: number;
  quest_type: QuestType;
  status: "ACTIVE";
  streak_count: number;
}

export interface DashboardResult {
  user: DashboardUser;
  quests: DashboardQuest[];
}

function computeXpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) {
    return SEASON_MAX_XP;
  }
  const nextThreshold = XP_LEVEL_THRESHOLDS.find((t) => t.level === level + 1);
  if (nextThreshold === undefined) {
    return SEASON_MAX_XP;
  }
  return nextThreshold.xpRequiredCumulative;
}

export async function getDashboard(userId: number): Promise<DashboardResult | null> {
  const { rows: userRows } = await pool.query<{
    username: string;
    level: number;
    current_xp: number;
    playable_balance: string;
    state: "ACTIVE" | "GULAG" | "REDEMPTION";
    wishlist_tokens_micro: number;
    wishlist_tokens_standard: number;
  }>(
    `SELECT username, level, current_xp, playable_balance, state,
            wishlist_tokens_micro, wishlist_tokens_standard
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (userRows.length === 0) {
    return null;
  }

  const row = userRows[0];
  const level = row.level;

  const user: DashboardUser = {
    username: row.username,
    level,
    current_xp: row.current_xp,
    xp_to_next_level: computeXpToNextLevel(level),
    playable_balance: parseFloat(row.playable_balance),
    state: row.state,
    wishlist_tokens_micro: row.wishlist_tokens_micro,
    wishlist_tokens_standard: row.wishlist_tokens_standard,
  };

  const { rows: questRows } = await pool.query<{
    id: number;
    title: string;
    xp_reward: number;
    quest_type: QuestType;
    status: "ACTIVE";
    streak_count: number;
  }>(
    `SELECT id, title, xp_reward, quest_type, status, streak_count
     FROM quests
     WHERE user_id = $1 AND status = 'ACTIVE'
     ORDER BY created_at ASC`,
    [userId]
  );

  return { user, quests: questRows };
}
