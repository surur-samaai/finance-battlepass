import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/authService";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.session.userId === undefined) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getUserById(req.session.userId);
  if (user === null) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = user;
  next();
}
