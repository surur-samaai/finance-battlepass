import type { PoolClient } from "pg";
import { pool } from "../db/index";
import {
  QUEST_TITLES,
  QUEST_XP_VALUES,
} from "../constants/gameConfig";
import type { BankWebhookPayload, GameEngineResult, UserRow, QuestRow } from "../types/gameLogic";
import { applyXpAndLevelUp } from "./levelUp";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validatePayload(raw: unknown): BankWebhookPayload {
  if (typeof raw !== "object" || raw === null) {
    throw new ValidationError("Payload must be a JSON object.");
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj["user_id"] !== "number" || !Number.isInteger(obj["user_id"])) {
    throw new ValidationError("user_id must be an integer.");
  }
  if (typeof obj["amount"] !== "number" || obj["amount"] <= 0) {
    throw new ValidationError("amount must be a positive number.");
  }
  if (typeof obj["merchant"] !== "string" || obj["merchant"].trim() === "") {
    throw new ValidationError("merchant must be a non-empty string.");
  }
  if (
    obj["system_category"] !== "FIXED_BILL" &&
    obj["system_category"] !== "DISCRETIONARY"
  ) {
    throw new ValidationError(
      "system_category must be 'FIXED_BILL' or 'DISCRETIONARY'."
    );
  }
  if (typeof obj["timestamp"] !== "string" || obj["timestamp"].trim() === "") {
    throw new ValidationError("timestamp must be a non-empty ISO 8601 string.");
  }

  return obj as unknown as BankWebhookPayload;
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function fetchUserForUpdate(
  client: PoolClient,
  userId: number
): Promise<UserRow> {
  const { rows } = await client.query<UserRow>(
    `SELECT id, playable_balance, current_xp, level,
            wishlist_tokens_micro, wishlist_tokens_standard, state
     FROM users
     WHERE id = $1
     FOR UPDATE`,
    [userId]
  );
  if (rows.length === 0) {
    throw new Error(`User ${userId} not found.`);
  }
  return rows[0];
}

async function fetchActiveQuests(
  client: PoolClient,
  userId: number
): Promise<QuestRow[]> {
  const { rows } = await client.query<QuestRow>(
    `SELECT id, user_id, title, xp_reward, quest_type, status, streak_count
     FROM quests
     WHERE user_id = $1 AND status = 'ACTIVE'`,
    [userId]
  );
  return rows;
}

async function getTodaysDiscretionaryTotal(
  client: PoolClient,
  userId: number
): Promise<number> {
  const { rows } = await client.query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND system_category = 'DISCRETIONARY'
       AND processed_at::date = CURRENT_DATE`,
    [userId]
  );
  return parseFloat(rows[0].total);
}

function getDailyDiscretionaryLimit(
  playableBalance: number,
  refDate: Date
): number {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = refDate.getDate();
  const daysRemaining = daysInMonth - today + 1;
  return playableBalance / daysRemaining;
}

// ---------------------------------------------------------------------------
// Violation check
// ---------------------------------------------------------------------------

function isViolationOfActiveQuests(
  quests: QuestRow[],
  amount: number,
  todayTotal: number,
  dailyLimit: number
): boolean {
  for (const quest of quests) {
    if (quest.quest_type !== "DAILY") continue;

    if (quest.title === QUEST_TITLES.ZERO_SPEND_DAY) {
      // Any discretionary spend violates a Zero Spend Day quest.
      return true;
    }

    if (quest.title === QUEST_TITLES.UNDER_BUDGET_DAY) {
      if (todayTotal + amount > dailyLimit) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Core engine
// ---------------------------------------------------------------------------

export async function processTransaction(
  payload: BankWebhookPayload,
  userId: number
): Promise<GameEngineResult> {
  if (payload.user_id !== userId) {
    throw new ValidationError("payload.user_id does not match the route userId.");
  }

  return withTransaction(async (client) => {
    const user = await fetchUserForUpdate(client, userId);
    const { amount, merchant, system_category } = payload;

    const baseResult: GameEngineResult = {
      success: true,
      newState: user.state,
      xpAwarded: 0,
      leveledUp: false,
      tokenAwarded: null,
      isViolation: false,
      toastMessages: [],
    };

    // ------------------------------------------------------------------
    // Branch 1: FIXED_BILL — deduct balance, log, stop. No game logic.
    // ------------------------------------------------------------------
    if (system_category === "FIXED_BILL") {
      await client.query(
        `UPDATE users SET playable_balance = playable_balance - $2 WHERE id = $1`,
        [userId, amount]
      );
      await client.query(
        `INSERT INTO transactions (user_id, amount, merchant, system_category, is_violation)
         VALUES ($1, $2, $3, $4, false)`,
        [userId, amount, merchant, system_category]
      );
      return baseResult;
    }

    // All remaining branches are DISCRETIONARY.

    // ------------------------------------------------------------------
    // Branch 2: GULAG — deduct balance, log as violation, stop.
    // ------------------------------------------------------------------
    if (user.state === "GULAG") {
      await client.query(
        `UPDATE users SET playable_balance = playable_balance - $2 WHERE id = $1`,
        [userId, amount]
      );
      await client.query(
        `INSERT INTO transactions (user_id, amount, merchant, system_category, is_violation)
         VALUES ($1, $2, $3, $4, true)`,
        [userId, amount, merchant, system_category]
      );
      return { ...baseResult, isViolation: true };
    }

    // ------------------------------------------------------------------
    // Branch 3: REDEMPTION — deduct balance, log (not a new violation),
    // keep state frozen. XP stays frozen per PRD Section 5.
    // ------------------------------------------------------------------
    if (user.state === "REDEMPTION") {
      await client.query(
        `UPDATE users SET playable_balance = playable_balance - $2 WHERE id = $1`,
        [userId, amount]
      );
      await client.query(
        `INSERT INTO transactions (user_id, amount, merchant, system_category, is_violation)
         VALUES ($1, $2, $3, $4, false)`,
        [userId, amount, merchant, system_category]
      );
      return baseResult;
    }

    // ------------------------------------------------------------------
    // Branch 4: ACTIVE + DISCRETIONARY
    // ------------------------------------------------------------------
    const activeQuests = await fetchActiveQuests(client, userId);
    const todayTotal = await getTodaysDiscretionaryTotal(client, userId);
    const dailyLimit = getDailyDiscretionaryLimit(
      parseFloat(user.playable_balance),
      new Date()
    );
    const violation = isViolationOfActiveQuests(
      activeQuests,
      amount,
      todayTotal,
      dailyLimit
    );

    // Deduct balance and log transaction regardless of violation.
    await client.query(
      `UPDATE users SET playable_balance = playable_balance - $2 WHERE id = $1`,
      [userId, amount]
    );
    await client.query(
      `INSERT INTO transactions (user_id, amount, merchant, system_category, is_violation)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, amount, merchant, system_category, violation]
    );

    if (violation) {
      // Freeze the Battle Pass — state becomes GULAG, XP/level unchanged.
      await client.query(
        `UPDATE users SET state = 'GULAG' WHERE id = $1`,
        [userId]
      );

      const gulagQuestXp =
        QUEST_XP_VALUES.find((q) => q.questKey === "GULAG_REDEMPTION")
          ?.xpReward ?? 50;

      await client.query(
        `INSERT INTO quests (user_id, title, xp_reward, quest_type, status, streak_count)
         VALUES ($1, $2, $3, 'GULAG_REDEMPTION', 'ACTIVE', 0)`,
        [userId, QUEST_TITLES.GULAG_REDEMPTION, gulagQuestXp]
      );

      return {
        ...baseResult,
        newState: "GULAG",
        isViolation: true,
        toastMessages: ["Violation detected. Battle Pass frozen."],
      };
    }

    // Non-violation: check if Under Budget Day quest is satisfied.
    let xpAwarded = 0;
    const toastMessages: string[] = [];

    const underBudgetQuest = activeQuests.find(
      (q) =>
        q.quest_type === "DAILY" &&
        q.title === QUEST_TITLES.UNDER_BUDGET_DAY
    );

    if (underBudgetQuest !== undefined) {
      xpAwarded = underBudgetQuest.xp_reward;
      await client.query(
        `UPDATE quests SET status = 'COMPLETE' WHERE id = $1 AND user_id = $2`,
        [underBudgetQuest.id, userId]
      );
      toastMessages.push(
        `+${xpAwarded} XP. ${underBudgetQuest.title} complete.`
      );
    }

    let leveledUp = false;
    let tokenAwarded: "MICRO" | "STANDARD" | null = null;

    if (xpAwarded > 0) {
      const outcome = await applyXpAndLevelUp(client, user, xpAwarded);
      leveledUp = outcome.leveledUp;
      tokenAwarded = outcome.tokenAwarded;
      toastMessages.push(...outcome.toastMessages);
    }

    return {
      success: true,
      newState: "ACTIVE",
      xpAwarded,
      leveledUp,
      tokenAwarded,
      isViolation: false,
      toastMessages,
    };
  });
}
