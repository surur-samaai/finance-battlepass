import { Router } from "express";
import {
  resetSeason,
  SeasonResetError,
} from "../services/seasonResetService";

const router = Router();

router.post("/reset-season", async (req, res) => {
  const userId = req.user!.id;

  try {
    const result = await resetSeason(userId);
    res.json(result);
  } catch (err) {
    if (err instanceof SeasonResetError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Season reset error:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    res.status(500).json({ error: message });
  }
});

export default router;
