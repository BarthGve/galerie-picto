import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";

export function useFavorites(isAuthenticated: boolean) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Ref kept in sync with state — allows stable toggleFavorite with no deps
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites(new Set());
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    setLoading(true);
    fetch(`${API_URL}/api/user/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFavorites(new Set(data.favorites || []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const isFavorite = useCallback((id: string) => favoritesRef.current.has(id), []);

  const toggleFavorite = useCallback(async (id: string) => {
    const token = getStoredToken();
    if (!token) return;

    const wasF = favoritesRef.current.has(id);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasF) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const res = await fetch(`${API_URL}/api/user/favorites/${id}`, {
        method: wasF ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Rollback
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasF) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }, []);

  return { favorites, isFavorite, toggleFavorite, favoritesCount: favorites.size, loading };
}
