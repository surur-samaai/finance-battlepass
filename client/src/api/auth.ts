import { apiClient } from "./client";

export interface AppUser {
  id: number;
  email: string;
  username: string;
  onboarding_complete: boolean;
}

export async function fetchMe(): Promise<AppUser> {
  const { data } = await apiClient.get<AppUser>("/auth/me");
  return data;
}
