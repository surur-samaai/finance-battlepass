import { pool } from "../db/index";

interface WishlistItemRow {
  id: number;
  item_name: string;
  price_zar: string;
  token_cost: number;
  token_type: "MICRO" | "STANDARD";
  is_purchased: boolean;
}

export interface WishlistItem {
  id: number;
  item_name: string;
  price_zar: number;
  token_cost: number;
  token_type: "MICRO" | "STANDARD";
  is_purchased: boolean;
}

export interface WishlistResult {
  items: WishlistItem[];
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
}

export async function getWishlist(userId: number): Promise<WishlistResult | null> {
  const { rows: userRows } = await pool.query<{
    wishlist_tokens_micro: number;
    wishlist_tokens_standard: number;
  }>(
    `SELECT wishlist_tokens_micro, wishlist_tokens_standard FROM users WHERE id = $1`,
    [userId]
  );

  if (userRows.length === 0) {
    return null;
  }

  const { rows: itemRows } = await pool.query<WishlistItemRow>(
    `SELECT id, item_name, price_zar, token_cost, token_type, is_purchased
     FROM wishlist
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );

  return {
    items: itemRows.map((r) => ({ ...r, price_zar: parseFloat(r.price_zar) })),
    wishlist_tokens_micro: userRows[0].wishlist_tokens_micro,
    wishlist_tokens_standard: userRows[0].wishlist_tokens_standard,
  };
}

export interface RedeemValidateResult {
  success: true;
  item: WishlistItem;
}

export async function validateRedeem(
  userId: number,
  itemId: number
): Promise<RedeemValidateResult> {
  const { rows: itemRows } = await pool.query<WishlistItemRow>(
    `SELECT id, item_name, price_zar, token_cost, token_type, is_purchased
     FROM wishlist
     WHERE id = $1 AND user_id = $2`,
    [itemId, userId]
  );

  if (itemRows.length === 0) {
    throw new RedeemError("Item not found.", 404);
  }

  const item = itemRows[0];

  if (item.is_purchased) {
    throw new RedeemError("Item has already been purchased.", 400);
  }

  const { rows: userRows } = await pool.query<{
    wishlist_tokens_micro: number;
    wishlist_tokens_standard: number;
  }>(
    `SELECT wishlist_tokens_micro, wishlist_tokens_standard FROM users WHERE id = $1`,
    [userId]
  );

  if (userRows.length === 0) {
    throw new RedeemError("User not found.", 404);
  }

  const user = userRows[0];
  const available =
    item.token_type === "MICRO"
      ? user.wishlist_tokens_micro
      : user.wishlist_tokens_standard;
  const tokenLabel = item.token_type === "MICRO" ? "Micro" : "Standard";

  if (available < item.token_cost) {
    throw new RedeemError(`Not enough ${tokenLabel}-Tokens.`, 400);
  }

  return {
    success: true,
    item: { ...item, price_zar: parseFloat(item.price_zar) },
  };
}

export interface ConfirmRedeemResult {
  success: true;
  toastMessages: string[];
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
}

export async function confirmRedeem(
  userId: number,
  itemId: number
): Promise<ConfirmRedeemResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: itemRows } = await client.query<WishlistItemRow>(
      `SELECT id, item_name, price_zar, token_cost, token_type, is_purchased
       FROM wishlist
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [itemId, userId]
    );

    if (itemRows.length === 0) {
      await client.query("ROLLBACK");
      throw new RedeemError("Item not found.", 404);
    }

    const item = itemRows[0];

    if (item.is_purchased) {
      await client.query("ROLLBACK");
      throw new RedeemError("Item has already been purchased.", 400);
    }

    const { rows: userRows } = await client.query<{
      wishlist_tokens_micro: number;
      wishlist_tokens_standard: number;
    }>(
      `SELECT wishlist_tokens_micro, wishlist_tokens_standard FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    if (userRows.length === 0) {
      await client.query("ROLLBACK");
      throw new RedeemError("User not found.", 404);
    }

    const user = userRows[0];
    const available =
      item.token_type === "MICRO"
        ? user.wishlist_tokens_micro
        : user.wishlist_tokens_standard;
    const tokenLabel = item.token_type === "MICRO" ? "Micro" : "Standard";

    if (available < item.token_cost) {
      await client.query("ROLLBACK");
      throw new RedeemError(`Not enough ${tokenLabel}-Tokens.`, 400);
    }

    if (item.token_type === "MICRO") {
      await client.query(
        `UPDATE users SET wishlist_tokens_micro = wishlist_tokens_micro - $2 WHERE id = $1`,
        [userId, item.token_cost]
      );
    } else {
      await client.query(
        `UPDATE users SET wishlist_tokens_standard = wishlist_tokens_standard - $2 WHERE id = $1`,
        [userId, item.token_cost]
      );
    }

    await client.query(`UPDATE wishlist SET is_purchased = true WHERE id = $1`, [itemId]);

    const { rows: updatedUserRows } = await client.query<{
      wishlist_tokens_micro: number;
      wishlist_tokens_standard: number;
    }>(
      `SELECT wishlist_tokens_micro, wishlist_tokens_standard FROM users WHERE id = $1`,
      [userId]
    );

    await client.query("COMMIT");

    return {
      success: true,
      toastMessages: [`Unlocked: ${item.item_name}. Go get it.`],
      wishlist_tokens_micro: updatedUserRows[0].wishlist_tokens_micro,
      wishlist_tokens_standard: updatedUserRows[0].wishlist_tokens_standard,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export class RedeemError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "RedeemError";
  }
}
