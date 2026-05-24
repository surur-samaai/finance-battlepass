import { apiClient } from "./client";
import type { SeasonResetResult } from "./types";

export async function resetSeason(): Promise<SeasonResetResult> {
  const { data } = await apiClient.post<SeasonResetResult>("/api/admin/reset-season");
  return data;
}
