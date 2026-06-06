import axios from "axios";
import { supabase } from "../lib/supabase";
import { rebrandUserFacingString } from "../utils/rebrandCopy";
import type { ApiErrorResponse } from "./types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
});

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    if (data?.error !== undefined) {
      return rebrandUserFacingString(data.error);
    }
    return rebrandUserFacingString(err.message);
  }
  if (err instanceof Error) {
    return rebrandUserFacingString(err.message);
  }
  return "An unexpected error occurred.";
}
