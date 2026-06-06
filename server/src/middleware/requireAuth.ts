import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { ensureAppUser } from "../services/authService";
import { getBearerToken } from "../utils/bearerToken";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = getBearerToken(req);
  if (token === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error !== null || data.user === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    req.user = await ensureAppUser(data.user);
    next();
  } catch (err) {
    console.error("requireAuth ensureAppUser error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}
