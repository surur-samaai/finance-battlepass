import { apiClient } from "./client";
import type { DashboardResponse, SeasonSummary } from "./types";

export async function fetchDashboard(userId: number): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>(`/api/user/${userId}/dashboard`);
  return data;
}

export async function fetchSeasonHistory(userId: number): Promise<SeasonSummary[]> {
  const { data } = await apiClient.get<SeasonSummary[]>(`/api/user/${userId}/seasons`);
  return data;
}
