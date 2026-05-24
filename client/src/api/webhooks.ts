import { apiClient } from "./client";
import type { BankWebhookPayload, GameEngineResult } from "./types";

export async function fireMockBankWebhook(
  payload: BankWebhookPayload
): Promise<GameEngineResult> {
  const { data } = await apiClient.post<GameEngineResult>("/api/webhooks/mock-bank", payload);
  return data;
}
