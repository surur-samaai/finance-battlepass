import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    onboarding_complete: user.onboarding_complete,
  });
});

export default router;
