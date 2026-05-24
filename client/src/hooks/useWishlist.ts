import { useState, useEffect, useCallback } from "react";
import { fetchWishlist } from "../api/wishlist";
import type { WishlistItem } from "../types";

interface UseWishlistResult {
  items: WishlistItem[];
  microTokens: number;
  standardTokens: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWishlist(userId: number): UseWishlistResult {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [microTokens, setMicroTokens] = useState(0);
  const [standardTokens, setStandardTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWishlist(userId);
      setItems(data.items);
      setMicroTokens(data.wishlist_tokens_micro);
      setStandardTokens(data.wishlist_tokens_standard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, microTokens, standardTokens, loading, error, refetch: load };
}
