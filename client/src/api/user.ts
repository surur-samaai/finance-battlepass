import { apiClient } from "./client";
import type { DashboardResponse } from "./types";

export async function fetchDashboard(userId: number): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>(`/api/user/${userId}/dashboard`);
  return data;
}
