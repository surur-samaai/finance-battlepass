import { Router } from "express";
import { sendStub } from "../utils/stubResponse";

const router = Router();

router.post("/:id/quests/:questId/complete", (_req, res) => {
  sendStub(res, "POST /api/user/:id/quests/:questId/complete");
});

export default router;
