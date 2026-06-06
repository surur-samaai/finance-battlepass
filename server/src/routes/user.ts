import { Router } from "express";
import { getDashboard } from "../services/dashboardService";
import { getSeasonHistory } from "../services/seasonHistoryService";
import {
  completeOnboarding,
  OnboardingError,
  type OnboardingCompletePayload,
} from "../services/onboardingService";

const router = Router();

function parseOnboardingPayload(body: unknown): OnboardingCompletePayload {
  if (body === null || typeof body !== "object") {
    throw new OnboardingError("Invalid onboarding payload.", 400);
  }

  const payload = body as Record<string, unknown>;
  const budgteerName = payload["budgteer_name"];
  const monthlyIncome = payload["monthly_income"];
  const fixedCosts = payload["fixed_costs"];
  const bankConnected = payload["bank_connected"];

  if (typeof budgteerName !== "string" || budgteerName.trim().length === 0) {
    throw new OnboardingError("Budgteer name is required.", 400);
  }
  if (typeof monthlyIncome !== "number" || !Number.isFinite(monthlyIncome)) {
    throw new OnboardingError("Monthly income must be a number.", 400);
  }
  if (typeof bankConnected !== "boolean") {
    throw new OnboardingError("Bank connection status is required.", 400);
  }
  if (!Array.isArray(fixedCosts)) {
    throw new OnboardingError("Fixed costs must be an array.", 400);
  }

  const parsedFixedCosts = fixedCosts
    .map((row) => {
      if (row === null || typeof row !== "object") {
        throw new OnboardingError("Invalid fixed cost row.", 400);
      }

      const fixedCost = row as Record<string, unknown>;
      const name = fixedCost["name"];
      const amount = fixedCost["amount"];

      if (typeof name !== "string") {
        throw new OnboardingError("Fixed cost name must be text.", 400);
      }
      if (typeof amount !== "number" || !Number.isFinite(amount)) {
        throw new OnboardingError("Fixed cost amount must be a number.", 400);
      }
      if (amount < 0) {
        throw new OnboardingError("Fixed cost amount cannot be negative.", 400);
      }

      return { name: name.trim(), amount };
    })
    .filter((row) => row.name.length > 0 || row.amount > 0);

  return {
    budgteer_name: budgteerName.trim(),
    monthly_income: monthlyIncome,
    fixed_costs: parsedFixedCosts,
    bank_connected: bankConnected,
  };
}

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

router.post("/:id/onboarding/complete", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  try {
    const payload = parseOnboardingPayload(req.body);
    const result = await completeOnboarding(routeUserId, payload);
    res.json(result);
  } catch (err) {
    if (err instanceof OnboardingError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Onboarding complete error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
