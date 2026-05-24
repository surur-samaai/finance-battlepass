import { Router } from "express";
import { getDashboard } from "../services/dashboardService";
import { getSeasonHistory } from "../services/seasonHistoryService";

const router = Router();

router.get("/:id/dashboard", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

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

router.get("/:id/seasons", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

  try {
    const seasons = await getSeasonHistory(userId);
    res.json(seasons);
  } catch (err) {
    console.error("Season history fetch error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
