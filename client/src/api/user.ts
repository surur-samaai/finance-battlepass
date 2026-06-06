import { apiClient } from "./client";
import type {
  DashboardResponse,
  OnboardingCompletePayload,
  OnboardingCompleteResponse,
  SeasonSummary,
} from "./types";

export async function fetchDashboard(userId: number): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>(`/api/user/${userId}/dashboard`);
  return data;
}

export async function fetchSeasonHistory(userId: number): Promise<SeasonSummary[]> {
  const { data } = await apiClient.get<SeasonSummary[]>(`/api/user/${userId}/seasons`);
  return data;
}

export async function completeOnboarding(
  userId: number,
  payload: OnboardingCompletePayload
): Promise<OnboardingCompleteResponse> {
  const { data } = await apiClient.post<OnboardingCompleteResponse>(
    `/api/user/${userId}/onboarding/complete`,
    payload
  );
  return data;
}
