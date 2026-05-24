import { pool } from "../db/index";
import { suggestWishlistTokenCost } from "../utils/wishlistPricing";

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

export class WishlistError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "WishlistError";
  }
}

export interface AddWishlistItemInput {
  item_name: string;
  price_zar: number;
  token_cost?: number;
  token_type?: "MICRO" | "STANDARD";
}

export async function addWishlistItem(
  userId: number,
  input: AddWishlistItemInput
): Promise<WishlistItem> {
  const itemName = input.item_name.trim();
  if (itemName.length === 0) {
    throw new WishlistError("Item name cannot be empty.", 400);
  }

  if (!isFinite(input.price_zar) || input.price_zar <= 0) {
    throw new WishlistError("Price must be a positive number.", 400);
  }

  const hasTokenCost = input.token_cost !== undefined;
  const hasTokenType = input.token_type !== undefined;

  if (hasTokenCost !== hasTokenType) {
    throw new WishlistError(
      "Provide both token_cost and token_type together, or neither.",
      400
    );
  }

  let resolvedTokenCost: number;
  let resolvedTokenType: "MICRO" | "STANDARD";

  if (hasTokenCost && hasTokenType) {
    if (input.token_cost! < 1) {
      throw new WishlistError("token_cost must be at least 1.", 400);
    }
    resolvedTokenCost = input.token_cost!;
    resolvedTokenType = input.token_type!;
  } else {
    const suggested = suggestWishlistTokenCost(input.price_zar);
    if ("manualRequired" in suggested) {
      throw new WishlistError(
        "Price over R800 requires manual token cost.",
        400
      );
    }
    resolvedTokenCost = suggested.tokenCost;
    resolvedTokenType = suggested.tokenType;
  }

  const { rows: userRows } = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE id = $1`,
    [userId]
  );
  if (userRows.length === 0) {
    throw new WishlistError("User not found.", 404);
  }

  const { rows } = await pool.query<WishlistItemRow>(
    `INSERT INTO wishlist (user_id, item_name, price_zar, token_cost, token_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, item_name, price_zar, token_cost, token_type, is_purchased`,
    [userId, itemName, input.price_zar, resolvedTokenCost, resolvedTokenType]
  );

  const row = rows[0];
  return { ...row, price_zar: parseFloat(row.price_zar) };
}

export async function deleteWishlistItem(
  userId: number,
  itemId: number
): Promise<{ success: true }> {
  const { rows } = await pool.query<WishlistItemRow>(
    `SELECT id, item_name, price_zar, token_cost, token_type, is_purchased
     FROM wishlist
     WHERE id = $1 AND user_id = $2`,
    [itemId, userId]
  );

  if (rows.length === 0) {
    throw new WishlistError("Item not found or does not belong to you.", 403);
  }

  if (rows[0].is_purchased) {
    throw new WishlistError("Cannot delete a purchased item.", 400);
  }

  await pool.query(`DELETE FROM wishlist WHERE id = $1`, [itemId]);

  return { success: true };
}
