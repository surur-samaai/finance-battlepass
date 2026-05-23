import { Router } from "express";
import { sendStub } from "../utils/stubResponse";

const router = Router();

router.post("/reset-season", (_req, res) => {
  sendStub(res, "POST /api/admin/reset-season");
});

export default router;
