import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredToken } from "@/lib/github-auth";
import { API_URL } from "@/lib/config";

export interface FeedbackNotification {
  id: number;
  type: "bug" | "improvement";
  title: string;
  resolution: string;
  url: string;
}

const SEEN_KEY = "feedback_seen_issues";

function getSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<number>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export function useFeedbackNotifications(isAuthenticated: boolean) {
  const [notifications, setNotifications] = useState<FeedbackNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const seenRef = useRef<Set<number>>(getSeenIds());
  const abortRef = useRef<AbortController | null>(null);

  // Compute unread from notifications list
  const refreshUnread = useCallback((notifs: FeedbackNotification[]) => {
    const seen = seenRef.current;
    setUnreadCount(notifs.filter((n) => !seen.has(n.id)).length);
  }, []);

  // Fetch resolved notifications from API
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
      refreshUnread(data);
    } catch {
      // silently ignore
    }
  }, [refreshUnread]);

  // SSE connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();

    // Poll every 60s as fallback (dev: no webhook, prod: redundancy)
    const pollInterval = setInterval(fetchNotifications, 60_000);

    const token = getStoredToken();
    if (!token) return () => clearInterval(pollInterval);

    let active = true;
    const controller = new AbortController();
    abortRef.current = controller;

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
                const notif = JSON.parse(
                  line.slice(6),
                ) as FeedbackNotification;
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === notif.id)) return prev;
                  const next = [notif, ...prev];
                  refreshUnread(next);
                  return next;
                });
                setUnreadCount((c) => c + 1);
              } catch {
                // malformed event, skip
              }
            }
          }
        } catch (err) {
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
  }, [isAuthenticated, fetchNotifications, refreshUnread]);

  const markAsRead = useCallback(
    (id: number) => {
      seenRef.current.add(id);
      saveSeenIds(seenRef.current);
      refreshUnread(notifications);
    },
    [notifications, refreshUnread],
  );

  const markAllAsRead = useCallback(() => {
    notifications.forEach((n) => seenRef.current.add(n.id));
    saveSeenIds(seenRef.current);
    setUnreadCount(0);
  }, [notifications]);

  const isRead = useCallback(
    (id: number) => seenRef.current.has(id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications],
  );

  return { notifications, unreadCount, markAsRead, markAllAsRead, isRead };
}
