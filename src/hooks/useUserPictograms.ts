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

    const toFetch = pictos.filter((p) => !blobUrlsRef.current.has(p.id));
    const CONCURRENCY = 6;

    for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
      const batch = toFetch.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (p) => {
          const res = await fetch(`${API_URL}/api/user/pictograms/${p.id}/file`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const blob = await res.blob();
          blobUrlsRef.current.set(p.id, URL.createObjectURL(blob));
        }),
      );
    }

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching pattern
    refetch();
  }, [refetch]);

  // Nettoyage des blob URLs à la déconnexion
  useEffect(() => {
    if (!isAuthenticated) {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
      setBlobUrls(new Map()); // eslint-disable-line react-hooks/set-state-in-effect -- cleanup on logout
      setUserPictograms([]);
    }
  }, [isAuthenticated]);

  // Nettoyage au démontage
  useEffect(() => {
    const ref = blobUrlsRef.current;
    return () => {
      ref.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const getBlobUrl = useCallback(
    (id: string) => blobUrls.get(id) ?? null,
    [blobUrls],
  );

  return { userPictograms, blobUrls, getBlobUrl, refetch };
}
