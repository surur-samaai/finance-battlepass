import { Router } from "express";
import { sendStub } from "../utils/stubResponse";

const router = Router();

router.post("/mock-bank", (_req, res) => {
  sendStub(res, "POST /api/webhooks/mock-bank");
});

export default router;
