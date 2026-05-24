import { Router } from "express";
import { processTransaction, validatePayload, ValidationError } from "../services/gameLogicEngine";

const router = Router();

router.post("/mock-bank", async (req, res) => {
  let payload;
  try {
    payload = validatePayload(req.body);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: "Invalid payload." });
    return;
  }

  if (payload.user_id !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  try {
    const result = await processTransaction(payload, payload.user_id);
    res.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    console.error("Game engine error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
