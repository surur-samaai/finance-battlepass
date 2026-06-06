import { Request } from "express";

export function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header === undefined || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}
