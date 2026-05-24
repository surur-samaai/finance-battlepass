import { useState, useEffect, useCallback } from "react";
import { fetchDashboard } from "../api/user";
import { HARDCODED_USER_ID } from "../constants/userId";
import type { User, Quest } from "../types";

interface UseDashboardResult {
  user: User | null;
  quests: Quest[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboard(HARDCODED_USER_ID);
      setUser(data.user);
      setQuests(data.quests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { user, quests, loading, error, refetch: load };
}
