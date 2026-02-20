import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import type { UserPictogram } from "@/lib/types";

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useUserPictograms(isAuthenticated: boolean) {
  const [userPictograms, setUserPictograms] = useState<UserPictogram[]>([]);
  // Map id → blob URL (authentifié)
  const [blobUrls, setBlobUrls] = useState<Map<string, string>>(new Map());
  const blobUrlsRef = useRef<Map<string, string>>(new Map());

  const fetchBlobUrls = useCallback(async (pictos: UserPictogram[]) => {
    const token = getStoredToken();
    if (!token || pictos.length === 0) return;

    const results = await Promise.allSettled(
      pictos.map(async (p) => {
        // Réutilise l'URL déjà chargée si elle existe
        if (blobUrlsRef.current.has(p.id)) return;
        const res = await fetch(`${API_URL}/api/user/pictograms/${p.id}/file`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        blobUrlsRef.current.set(p.id, url);
      }),
    );
    void results;
    setBlobUrls(new Map(blobUrlsRef.current));
  }, []);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/user/pictograms`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      const pictos: UserPictogram[] = data.userPictograms ?? [];
      setUserPictograms(pictos);
      await fetchBlobUrls(pictos);
    } catch {
      // silently fail
    }
  }, [isAuthenticated, fetchBlobUrls]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Nettoyage des blob URLs à la déconnexion
  useEffect(() => {
    if (!isAuthenticated) {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
      setBlobUrls(new Map());
      setUserPictograms([]);
    }
  }, [isAuthenticated]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const getBlobUrl = useCallback(
    (id: string) => blobUrls.get(id) ?? null,
    [blobUrls],
  );

  return { userPictograms, blobUrls, getBlobUrl, refetch };
}
