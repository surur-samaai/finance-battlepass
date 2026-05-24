import type { PoolClient } from "pg";
import {
  GULAG_REDEMPTION_STREAK_DAYS,
  gulagProgressToast,
} from "../constants/gameConfig";
import type { TokenType, UserState } from "../constants/gameConfig";
import type { QuestRow, UserRow } from "../types/gameLogic";
import { applyXpAndLevelUp } from "./levelUp";

export interface GulagStreakResult {
  newState: UserState;
  streakCount: number;
  toastMessages: string[];
  xpAwarded: number;
  leveledUp: boolean;
  tokenAwarded: TokenType | null;
}

function toLocalDateOnly(value: Date | string): Date {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateForPg(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function noChangeResult(
  user: UserRow,
  gulagQuest: QuestRow
): GulagStreakResult {
  return {
    newState: user.state,
    streakCount: gulagQuest.streak_count,
    toastMessages: [],
    xpAwarded: 0,
    leveledUp: false,
    tokenAwarded: null,
  };
}

async function hasZeroDiscretionarySpend(
  client: PoolClient,
  userId: number,
  date: Date
): Promise<boolean> {
  const dateStr = formatDateForPg(date);
  const { rows } = await client.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count
     FROM transactions
     WHERE user_id = $1
       AND system_category = 'DISCRETIONARY'
       AND processed_at::date = $2::date`,
    [userId, dateStr]
  );
  return parseInt(rows[0].count, 10) === 0;
}

/**
 * Evaluates whether yesterday (relative to the webhook timestamp) was a
 * zero-discretionary day and advances the Gulag redemption streak if so.
 * Must be called before inserting the current transaction.
 */
export async function tryAdvanceGulagStreak(
  client: PoolClient,
  userId: number,
  user: UserRow,
  gulagQuest: QuestRow,
  referenceTimestamp: string
): Promise<GulagStreakResult> {
  const unchanged = noChangeResult(user, gulagQuest);

  const referenceDate = toLocalDateOnly(referenceTimestamp);
  const candidateDate = addDays(referenceDate, -1);
  const questCreatedDate = toLocalDateOnly(gulagQuest.created_at);

  if (candidateDate.getTime() <= questCreatedDate.getTime()) {
    return unchanged;
  }

  if (gulagQuest.last_streak_date !== null) {
    const lastStreakDate = parseDateOnly(gulagQuest.last_streak_date);
    if (candidateDate.getTime() <= lastStreakDate.getTime()) {
      return unchanged;
    }
  }

  const isZeroDay = await hasZeroDiscretionarySpend(
    client,
    userId,
    candidateDate
  );
  if (!isZeroDay) {
    return unchanged;
  }

  let newStreakCount: number;
  if (gulagQuest.last_streak_date === null) {
    newStreakCount = 1;
  } else {
    const lastStreakDate = parseDateOnly(gulagQuest.last_streak_date);
    const expectedNext = addDays(lastStreakDate, 1);
    if (candidateDate.getTime() === expectedNext.getTime()) {
      newStreakCount = gulagQuest.streak_count + 1;
    } else if (candidateDate.getTime() > expectedNext.getTime()) {
      newStreakCount = 1;
    } else {
      return unchanged;
    }
  }

  const candidateDateStr = formatDateForPg(candidateDate);

  await client.query(
    `UPDATE quests
     SET streak_count = $2, last_streak_date = $3::date
     WHERE id = $1`,
    [gulagQuest.id, newStreakCount, candidateDateStr]
  );

  const toastMessages: string[] = [];
  let newState: UserState = user.state;
  let xpAwarded = 0;
  let leveledUp = false;
  let tokenAwarded: TokenType | null = null;

  if (newStreakCount >= GULAG_REDEMPTION_STREAK_DAYS) {
    await client.query(
      `UPDATE quests SET status = 'COMPLETE' WHERE id = $1`,
      [gulagQuest.id]
    );
    await client.query(
      `UPDATE users SET state = 'ACTIVE' WHERE id = $1`,
      [userId]
    );
    newState = "ACTIVE";
    toastMessages.push("Redemption complete. Battle Pass unlocked.");

    const outcome = await applyXpAndLevelUp(client, user, gulagQuest.xp_reward);
    xpAwarded = gulagQuest.xp_reward;
    leveledUp = outcome.leveledUp;
    tokenAwarded = outcome.tokenAwarded;
    toastMessages.push(
      `+${gulagQuest.xp_reward} XP. ${gulagQuest.title} complete.`
    );
    toastMessages.push(...outcome.toastMessages);
  } else {
    toastMessages.push(gulagProgressToast(newStreakCount));
    if (newStreakCount === 1 && user.state === "GULAG") {
      await client.query(
        `UPDATE users SET state = 'REDEMPTION' WHERE id = $1`,
        [userId]
      );
      newState = "REDEMPTION";
    }
  }

  return {
    newState,
    streakCount: newStreakCount,
    toastMessages,
    xpAwarded,
    leveledUp,
    tokenAwarded,
  };
}
