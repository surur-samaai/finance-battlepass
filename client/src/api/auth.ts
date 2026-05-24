import { apiClient } from "./client";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}

export function getGoogleLoginUrl(): string {
  return `${import.meta.env.VITE_API_URL as string}/auth/google`;
}

export function getLogoutUrl(): string {
  return `${import.meta.env.VITE_API_URL as string}/auth/logout`;
}
