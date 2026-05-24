import { Router } from "express";
import passport from "passport";
import { getUserById } from "../services/authService";
import type { AuthUser } from "../types/express";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/error" }),
  (req, res) => {
    const user = req.user as AuthUser;
    req.session.userId = user.id;
    res.redirect(process.env.CLIENT_URL ?? "http://localhost:5173");
  }
);

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect(process.env.CLIENT_URL ?? "http://localhost:5173");
  });
});

router.get("/me", async (req, res) => {
  if (req.session.userId === undefined) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await getUserById(req.session.userId);
    if (user === null) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({ id: user.id, username: user.username, email: user.email });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/error", (_req, res) => {
  res.status(401).json({ error: "Google authentication failed." });
});

export default router;
