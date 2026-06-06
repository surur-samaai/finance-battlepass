import { pool } from "../db/index";
import { seedDefaultQuests } from "./questSeedService";

export interface FixedCostPayload {
  name: string;
  amount: number;
}

export interface OnboardingCompletePayload {
  budgteer_name: string;
  monthly_income: number;
  fixed_costs: FixedCostPayload[];
  bank_connected: boolean;
}

export class OnboardingError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "OnboardingError";
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function completeOnboarding(
  userId: number,
  payload: OnboardingCompletePayload
): Promise<{ success: true }> {
  const budgteerName = payload.budgteer_name.trim();
  if (budgteerName.length === 0) {
    throw new OnboardingError("Budgteer name is required.", 400);
  }
  if (!Number.isFinite(payload.monthly_income) || payload.monthly_income <= 0) {
    throw new OnboardingError("Monthly income must be a positive number.", 400);
  }

  const fixedCostTotal = payload.fixed_costs.reduce(
    (total, row) => total + row.amount,
    0
  );
  const playableBalance = roundCurrency(payload.monthly_income - fixedCostTotal);

  if (playableBalance < 0) {
    throw new OnboardingError(
      "Fixed costs cannot exceed monthly income.",
      400
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: userRows } = await client.query<{
      onboarding_complete: boolean;
    }>(
      `SELECT onboarding_complete
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (userRows.length === 0) {
      throw new OnboardingError("User not found.", 404);
    }
    if (userRows[0].onboarding_complete) {
      throw new OnboardingError("Onboarding is already complete.", 409);
    }

    await client.query(
      `UPDATE users
       SET budgteer_name = $2,
           playable_balance = $3,
           bank_connected = $4,
           onboarding_complete = TRUE
       WHERE id = $1`,
      [userId, budgteerName, playableBalance, payload.bank_connected]
    );

    const { rows: seasonRows } = await client.query<{ id: number }>(
      `INSERT INTO seasons (user_id, season_number, start_date)
       VALUES ($1, 1, CURRENT_DATE)
       RETURNING id`,
      [userId]
    );

    await client.query(
      `UPDATE users
       SET current_season_id = $2
       WHERE id = $1`,
      [userId, seasonRows[0].id]
    );

    await seedDefaultQuests(client, userId);

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
