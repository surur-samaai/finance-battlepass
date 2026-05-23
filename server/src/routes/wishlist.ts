import { Router } from "express";
import { sendStub } from "../utils/stubResponse";

const router = Router();

router.get("/:id/wishlist", (_req, res) => {
  sendStub(res, "GET /api/user/:id/wishlist");
});

router.post("/:id/wishlist/:itemId/redeem", (_req, res) => {
  sendStub(res, "POST /api/user/:id/wishlist/:itemId/redeem");
});

router.post("/:id/wishlist/:itemId/confirm-redeem", (_req, res) => {
  sendStub(res, "POST /api/user/:id/wishlist/:itemId/confirm-redeem");
});

export default router;
