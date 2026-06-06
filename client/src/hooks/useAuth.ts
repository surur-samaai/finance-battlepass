import { useState, useEffect, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchMe, type AppUser } from "../api/auth";

interface UseAuthResult {
  session: Session | null;
  supabaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refetchAppUser: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppUser = useCallback(async () => {
    try {
      const user = await fetchMe();
      setAppUser(user);
      setError(null);
    } catch (err) {
      setAppUser(null);
      setError(
        err instanceof Error ? err.message : "Failed to load user profile."
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(initialSession);
      setSupabaseUser(initialSession?.user ?? null);
      if (initialSession) {
        await loadAppUser();
      } else {
        setAppUser(null);
      }
      if (mounted) setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setSupabaseUser(nextSession?.user ?? null);
      if (nextSession) {
        await loadAppUser();
      } else {
        setAppUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAppUser]);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setAppUser(null);
  };

  return { session, supabaseUser, appUser, loading, error, signOut, refetchAppUser: loadAppUser };
}
