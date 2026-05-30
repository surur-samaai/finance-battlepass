import axios from "axios";
import { rebrandUserFacingString } from "../utils/rebrandCopy";
import type { ApiErrorResponse } from "./types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
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
