import { useCallback, useEffect, useState } from "react";
import { getStoredToken } from "@/lib/github-auth";
import { API_URL } from "@/lib/config";

export interface GdprRequest {
  id: string;
  requesterLogin: string;
  requesterName: string | null;
  requesterEmail: string | null;
  requesterAvatar: string | null;
  rightType: string;
  message: string;
  status: string;
  consentContact: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface GdprHistoryEntry {
  id: string;
  actorLogin: string;
  actorAvatar: string | null;
  actorName: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  detail: string | null;
  detailAvatar: string | null;
  detailName: string | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

export function useAdminGdprRequests() {
  const [requests, setRequests] = useState<GdprRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [newCount, setNewCount] = useState(0);

  const fetchRequests = useCallback(
    async (p: number, status?: string) => {
      const token = getStoredToken();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(PAGE_SIZE),
        });
        if (status) params.set("status", status);

        const res = await fetch(
          `${API_URL}/api/gdpr-requests/admin?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = (await res.json()) as {
          requests: GdprRequest[];
          total: number;
        };
        setRequests(data.requests);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchCount = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/gdpr-requests/admin/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { count: number };
        setNewCount(data.count);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchRequests(page, statusFilter);
  }, [fetchRequests, page, statusFilter]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const updateStatus = useCallback(
    async (id: string, newStatus: string, responseMessage?: string) => {
      const token = getStoredToken();
      if (!token) return;
      try {
        const body: Record<string, string> = { status: newStatus };
        if (responseMessage) body.responseMessage = responseMessage;

        const res = await fetch(
          `${API_URL}/api/gdpr-requests/admin/${id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Erreur ${res.status}`);
        }
        await Promise.allSettled([
          fetchRequests(page, statusFilter),
          fetchCount(),
        ]);
      } catch (err) {
        throw err;
      }
    },
    [fetchRequests, fetchCount, page, statusFilter],
  );

  const fetchHistory = useCallback(async (id: string) => {
    const token = getStoredToken();
    if (!token) return [];
    try {
      const res = await fetch(
        `${API_URL}/api/gdpr-requests/admin/${id}/history`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = (await res.json()) as { history: GdprHistoryEntry[] };
        return data.history;
      }
    } catch {
      // silently ignore
    }
    return [];
  }, []);

  return {
    requests,
    total,
    loading,
    error,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    statusFilter,
    setStatusFilter,
    updateStatus,
    newCount,
    fetchHistory,
    refetch: () => {
      fetchRequests(page, statusFilter);
      fetchCount();
    },
  };
}
