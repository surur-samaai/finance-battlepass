import { Router } from "express";
import { sendStub } from "../utils/stubResponse";

const router = Router();

router.get("/google", (_req, res) => {
  sendStub(res, "GET /auth/google");
});

router.get("/google/callback", (_req, res) => {
  sendStub(res, "GET /auth/google/callback");
});

router.get("/logout", (_req, res) => {
  sendStub(res, "GET /auth/logout");
});

export default router;
