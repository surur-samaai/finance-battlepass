import { Router } from "express";
import {
  getWishlist,
  addWishlistItem,
  deleteWishlistItem,
  validateRedeem,
  confirmRedeem,
  RedeemError,
  WishlistError,
} from "../services/wishlistService";

const router = Router();

router.get("/:id/wishlist", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

  try {
    const result = await getWishlist(userId);

    if (result === null) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error("Wishlist fetch error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/:id/wishlist", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

  try {
    const item = await addWishlistItem(userId, {
      item_name: req.body.item_name as string,
      price_zar: req.body.price_zar as number,
      token_cost: req.body.token_cost as number | undefined,
      token_type: req.body.token_type as "MICRO" | "STANDARD" | undefined,
    });
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof WishlistError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Add wishlist item error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/:id/wishlist/:itemId", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);
  const itemId = parseInt(req.params["itemId"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id || isNaN(itemId)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

  try {
    const result = await deleteWishlistItem(userId, itemId);
    res.json(result);
  } catch (err) {
    if (err instanceof WishlistError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Delete wishlist item error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/:id/wishlist/:itemId/redeem", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);
  const itemId = parseInt(req.params["itemId"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id || isNaN(itemId)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

  try {
    const result = await validateRedeem(userId, itemId);
    res.json(result);
  } catch (err) {
    if (err instanceof RedeemError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Redeem validate error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/:id/wishlist/:itemId/confirm-redeem", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);
  const itemId = parseInt(req.params["itemId"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id || isNaN(itemId)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

  try {
    const result = await confirmRedeem(userId, itemId);
    res.json(result);
  } catch (err) {
    if (err instanceof RedeemError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Confirm redeem error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
