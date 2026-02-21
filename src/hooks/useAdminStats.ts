import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/lib/github-auth";
import { API_URL } from "@/lib/config";

export interface AdminStats {
  pictograms: { total: number; neverDownloaded: { id: string; name: string }[] };
  users: {
    total: number;
    activeLast30Days: number;
    recentSignups: {
      githubLogin: string;
      githubAvatarUrl: string | null;
      firstSeenAt: string | null;
    }[];
  };
  downloads: {
    total: number;
    topPictograms: { id: string; name: string; count: number }[];
  };
  likes: {
    topPictograms: { id: string; name: string; count: number }[];
  };
  recentPictograms: { id: string; name: string; createdAt: string | null }[];
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data = (await res.json()) as AdminStats;
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les stats",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
