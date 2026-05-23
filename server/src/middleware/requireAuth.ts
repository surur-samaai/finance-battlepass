import { Request, Response, NextFunction } from "express";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.SKIP_AUTH === "true") {
    next();
    return;
  }

  if (req.session?.userId !== undefined) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}
