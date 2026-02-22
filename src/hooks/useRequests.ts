import { useState, useCallback, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import type {
  PictoRequest,
  PictoRequestComment,
  PictoRequestStatus,
} from "@/lib/types";
import type { HistoryEntry } from "@/lib/request-constants";

export function useRequests(isAuthenticated: boolean) {
  const [requests, setRequests] = useState<PictoRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchRequests();
  }, [isAuthenticated, fetchRequests]);

  const createRequest = useCallback(
    async (input: {
      title: string;
      description: string;
      referenceImageKey?: string;
      urgency?: "normale" | "urgente";
    }): Promise<string | null> => {
      const token = getStoredToken();
      if (!token) return null;
      try {
        const res = await fetch(`${API_URL}/api/requests`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        if (!res.ok) return null;
        const data = await res.json();
        await fetchRequests();
        return data.id;
      } catch {
        return null;
      }
    },
    [fetchRequests],
  );

  const getRequestDetail = useCallback(
    async (id: string): Promise<PictoRequest | null> => {
      const token = getStoredToken();
      if (!token) return null;
      try {
        const res = await fetch(`${API_URL}/api/requests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.request;
      } catch {
        return null;
      }
    },
    [],
  );

  const getComments = useCallback(
    async (requestId: string): Promise<PictoRequestComment[]> => {
      const token = getStoredToken();
      if (!token) return [];
      try {
        const res = await fetch(
          `${API_URL}/api/requests/${requestId}/comments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.comments;
      } catch {
        return [];
      }
    },
    [],
  );

  const addComment = useCallback(
    async (requestId: string, content: string): Promise<boolean> => {
      const token = getStoredToken();
      if (!token) return false;
      try {
        const res = await fetch(
          `${API_URL}/api/requests/${requestId}/comments`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
          },
        );
        return res.ok;
      } catch {
        return false;
      }
    },
    [],
  );

  const uploadReferenceImage = useCallback(
    async (
      file: File,
    ): Promise<string | null> => {
      const token = getStoredToken();
      if (!token) return null;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      try {
        const res = await fetch(`${API_URL}/api/requests/upload-reference`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: base64, mimeType: file.type }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.key;
      } catch {
        return null;
      }
    },
    [],
  );

  const getHistory = useCallback(
    async (requestId: string): Promise<HistoryEntry[]> => {
      const token = getStoredToken();
      if (!token) return [];
      try {
        const res = await fetch(
          `${API_URL}/api/requests/${requestId}/history`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.history;
      } catch {
        return [];
      }
    },
    [],
  );

  return {
    requests,
    loading,
    fetchRequests,
    createRequest,
    getRequestDetail,
    getComments,
    addComment,
    getHistory,
    uploadReferenceImage,
  };
}

export function useAdminRequests() {
  const [requests, setRequests] = useState<PictoRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async (statusFilter?: PictoRequestStatus) => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    try {
      const url = statusFilter
        ? `${API_URL}/api/requests/admin?status=${statusFilter}`
        : `${API_URL}/api/requests/admin`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRequest = useCallback(async (requestId: string, assignTo?: string): Promise<boolean> => {
    const token = getStoredToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_URL}/api/requests/${requestId}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(assignTo ? { assignTo } : {}),
      });
      if (res.ok) await fetchAll();
      return res.ok;
    } catch {
      return false;
    }
  }, [fetchAll]);

  const updateStatus = useCallback(
    async (
      requestId: string,
      status: PictoRequestStatus,
      extra?: { rejectionReason?: string; deliveredPictogramId?: string; comment?: string },
    ): Promise<boolean> => {
      const token = getStoredToken();
      if (!token) return false;
      try {
        const res = await fetch(
          `${API_URL}/api/requests/${requestId}/status`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status, ...extra }),
          },
        );
        if (res.ok) await fetchAll();
        return res.ok;
      } catch {
        return false;
      }
    },
    [fetchAll],
  );

  const getRequestDetail = useCallback(
    async (id: string): Promise<PictoRequest | null> => {
      const token = getStoredToken();
      if (!token) return null;
      try {
        const res = await fetch(`${API_URL}/api/requests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.request;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    requests,
    loading,
    fetchAll,
    assignRequest,
    updateStatus,
    getRequestDetail,
  };
}
