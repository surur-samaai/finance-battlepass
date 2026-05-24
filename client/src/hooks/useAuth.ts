import { useState, useEffect } from "react";
import axios from "axios";
import { fetchMe, getLogoutUrl } from "../api/auth";
import type { AuthUser } from "../api/auth";

interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((u) => setUser(u))
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setUser(null);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to check auth status."
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = (): void => {
    window.location.href = getLogoutUrl();
  };

  return { user, loading, error, logout };
}
