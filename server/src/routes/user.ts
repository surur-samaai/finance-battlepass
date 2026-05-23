import { Router } from "express";
import { sendStub } from "../utils/stubResponse";

const router = Router();

router.get("/:id/dashboard", (_req, res) => {
  sendStub(res, "GET /api/user/:id/dashboard");
});

export default router;
