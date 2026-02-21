import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredToken } from "@/lib/github-auth";
import { API_URL } from "@/lib/config";

export interface FeedbackNotification {
  id: number;
  type: "bug" | "improvement";
  title: string;
  resolution: string;
  url: string;
  isRead: boolean;
}

export function useFeedbackNotifications(isAuthenticated: boolean) {
  const [notifications, setNotifications] = useState<FeedbackNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/feedback/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as FeedbackNotification[];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {
      // silently ignore
    }
  }, []);

  // Ref pour éviter que l'effet SSE ne se reconnecte quand le callback change
  const fetchNotificationsRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // SSE connection — ne dépend que de isAuthenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotificationsRef.current();

    // Poll every 60s as fallback (dev: no webhook, prod: redundancy)
    const pollInterval = setInterval(
      () => fetchNotificationsRef.current(),
      60_000,
    );

    const token = getStoredToken();
    if (!token) return () => clearInterval(pollInterval);

    let active = true;
    const controller = new AbortController();

    async function connect() {
      while (active) {
        try {
          const res = await fetch(`${API_URL}/api/feedback/stream`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (active) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const payload = JSON.parse(line.slice(6)) as Omit<
                  FeedbackNotification,
                  "isRead"
                >;
                const notif: FeedbackNotification = {
                  ...payload,
                  isRead: false,
                };
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === notif.id)) return prev;
                  return [notif, ...prev];
                });
                setUnreadCount((c) => c + 1);
              } catch {
                // malformed event, skip
              }
            }
          }
        } catch {
          if (!active) break;
          // Network error — retry after 5s
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    }

    connect();

    return () => {
      active = false;
      controller.abort();
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]); // Seule vraie dépendance : login/logout

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(next.filter((n) => !n.isRead).length);
      return next;
    });
    const token = getStoredToken();
    if (token) {
      fetch(`${API_URL}/api/feedback/seen/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const unreadIds = prev.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length > 0) {
        const token = getStoredToken();
        if (token) {
          fetch(`${API_URL}/api/feedback/seen/all`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids: unreadIds }),
          }).catch(() => {});
        }
      }
      return prev.map((n) => ({ ...n, isRead: true }));
    });
    setUnreadCount(0);
  }, []);

  const isRead = useCallback(
    (id: number) => notifications.find((n) => n.id === id)?.isRead ?? true,
    [notifications],
  );

  return { notifications, unreadCount, markAsRead, markAllAsRead, isRead };
}
