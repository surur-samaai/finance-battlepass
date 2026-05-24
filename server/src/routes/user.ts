import { Router } from "express";
import { getDashboard } from "../services/dashboardService";

const router = Router();

router.get("/:id/dashboard", async (req, res) => {
  const userId = parseInt(req.params["id"], 10);

  if (isNaN(userId)) {
    res.status(400).json({ error: "id must be an integer." });
    return;
  }

  try {
    const result = await getDashboard(userId);

    if (result === null) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
