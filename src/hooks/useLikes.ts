import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";

export function useLikes(isAuthenticated: boolean) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = getStoredToken();
    // Toujours charger les counts (publics). Si connecté, charge aussi les liked.
    fetch(`${API_URL}/api/pictograms/likes`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { counts: Record<string, number>; liked: string[] } | null) => {
        if (!data) return;
        setCounts(new Map(Object.entries(data.counts ?? {})));
        setLiked(new Set(data.liked ?? []));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const getLikeCount = useCallback(
    (id: string) => counts.get(id) ?? 0,
    [counts],
  );

  const hasLiked = useCallback((id: string) => liked.has(id), [liked]);

  const toggleLike = useCallback(
    async (id: string) => {
      const token = getStoredToken();
      if (!token) return;

      const wasLiked = liked.has(id);
      const prevCount = counts.get(id) ?? 0;

      // Optimistic update
      setLiked((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(id);
        else next.add(id);
        return next;
      });
      setCounts((prev) => {
        const next = new Map(prev);
        const newCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
        if (newCount === 0) next.delete(id);
        else next.set(id, newCount);
        return next;
      });

      try {
        const res = await fetch(`${API_URL}/api/pictograms/${id}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        // Sync with server truth
        setLiked((prev) => {
          const next = new Set(prev);
          if (data.liked) next.add(id);
          else next.delete(id);
          return next;
        });
        setCounts((prev) => {
          const next = new Map(prev);
          if (data.count === 0) next.delete(id);
          else next.set(id, data.count);
          return next;
        });
      } catch {
        // Rollback
        setLiked((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(id);
          else next.delete(id);
          return next;
        });
        setCounts((prev) => {
          const next = new Map(prev);
          if (prevCount === 0) next.delete(id);
          else next.set(id, prevCount);
          return next;
        });
      }
    },
    [liked, counts],
  );

  return { getLikeCount, hasLiked, toggleLike };
}
