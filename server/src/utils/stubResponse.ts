import { Response } from "express";

export interface StubResponse {
  status: "stub";
  endpoint: string;
}

export function sendStub(res: Response, endpoint: string): void {
  const body: StubResponse = { status: "stub", endpoint };
  res.json(body);
}
