import { Moon, Search, Sun, Bell, Bug, Sparkles, CheckCircle2, MessageSquarePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/use-theme";
import type { FeedbackNotification } from "@/hooks/useFeedbackNotifications";
import type { AppNotification } from "@/lib/types";

export function SiteHeader({
  onSearch,
  totalCount,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDismissNotif,
  onDismissAppNotif,
  onClearAllNotifs,
  onGoFeedback,
  isAuthenticated,
  appNotifications,
  onAppMarkRead,
  onGoRequests,
  onFetchAppNotifications,
}: {
  onSearch: (query: string) => void;
  totalCount: number;
  notifications?: FeedbackNotification[];
  unreadCount?: number;
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
  onGoFeedback?: () => void;
  isAuthenticated?: boolean;
  appNotifications?: AppNotification[];
  appUnreadCount?: number;
  onAppMarkRead?: (id: string) => void;
  onAppMarkAllRead?: () => void;
  onDismissNotif?: (id: number) => void;
  onDismissAppNotif?: (id: string) => void;
  onClearAllNotifs?: () => void;
  onGoRequests?: () => void;
  onFetchAppNotifications?: () => void;
}) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "feedback" | "app";
    id: number | string;
  } | null>(null);

  useEffect(() => {
    const threshold = 60;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > threshold && y > lastScrollY.current) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), 350);
  };

  const hasNotifs = (unreadCount ?? 0) > 0;
  const notifList = notifications ?? [];
  const totalNotifCount = notifList.length + (appNotifications ?? []).length;

  function handleBellClick() {
    setBellOpen((v) => {
      if (!v) onFetchAppNotifications?.();
      return !v;
    });
  }

  function handleNotifClick(n: FeedbackNotification) {
    onMarkRead?.(n.id);
    setBellOpen(false);
    onGoFeedback?.();
  }

  function handleContextMenu(
    e: React.MouseEvent,
    type: "feedback" | "app",
    id: number | string,
  ) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function handleDismissFromContext() {
    if (!contextMenu) return;
    if (contextMenu.type === "feedback") {
      onDismissNotif?.(contextMenu.id as number);
    } else {
      onDismissAppNotif?.(contextMenu.id as string);
    }
    closeContextMenu();
  }

  return (
    <header className={`sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 px-6 py-4 transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded">
        Aller au contenu principal
      </a>
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder={`Rechercher parmi ${totalCount} pictogrammes...`}
            aria-label="Rechercher des pictogrammes"
            value={query}
            onChange={handleChange}
            className="w-full md:w-[400px] h-11 bg-white border border-border rounded pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-ring/10 focus:border-primary transition-all shadow-sm dark:bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell — only for authenticated users */}
        {isAuthenticated && (
          <div className="relative" ref={bellRef}>
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {hasNotifs && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center leading-none">
                  {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel */}
            {bellOpen && (
              <>
                {/* Backdrop — ferme panel et context menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => { setBellOpen(false); closeContextMenu(); }}
                  onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded border border-border bg-popover shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-semibold text-sm">Notifications</span>
                    {totalNotifCount > 0 && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onMarkAllRead?.()}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Tout lu
                        </button>
                        <button
                          onClick={() => { onClearAllNotifs?.(); }}
                          className="text-xs text-destructive/70 hover:text-destructive transition-colors"
                        >
                          Tout effacer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {/* App notifications (demandes) */}
                    {(appNotifications ?? []).length > 0 && (
                      <>
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border/50">
                          Demandes
                        </div>
                        {(appNotifications ?? []).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              onAppMarkRead?.(n.id);
                              setBellOpen(false);
                              if (n.link?.startsWith("/requests")) onGoRequests?.();
                            }}
                            onContextMenu={(e) => handleContextMenu(e, "app", n.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-accent/60 transition-colors border-b border-border/50 last:border-0 ${!n.isRead ? "bg-accent/30" : ""}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 shrink-0">
                                <MessageSquarePlus className="size-3.5 text-indigo-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                              </div>
                              {!n.isRead && (
                                <span className="size-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Feedback notifications */}
                    {notifList.length > 0 && (
                      <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border/50">
                        Signalements
                      </div>
                    )}
                    {notifList.length === 0 && (appNotifications ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8 px-4">
                        Pas de nouvelle pour le moment.
                      </p>
                    ) : (
                      notifList.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          onContextMenu={(e) => handleContextMenu(e, "feedback", n.id)}
                          className="w-full text-left px-4 py-3 hover:bg-accent/60 transition-colors border-b border-border/50 last:border-0"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 shrink-0">
                              {n.type === "bug" ? (
                                <Bug className="size-3.5 text-orange-500" />
                              ) : (
                                <Sparkles className="size-3.5 text-[#6a6af4]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">
                                  {n.type === "bug"
                                    ? "Bug résolu"
                                    : "Amélioration déployée"}
                                </p>
                                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {n.title}
                              </p>
                              {n.resolution && (
                                <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
                                  {n.resolution}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Context menu clic droit */}
                {contextMenu && (
                  <div
                    className="fixed z-[60] min-w-[140px] rounded border border-border bg-popover shadow-lg py-1 text-sm"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onMouseLeave={closeContextMenu}
                  >
                    <button
                      onClick={handleDismissFromContext}
                      className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60 select-none">
          v{__APP_VERSION__}
        </span>
      </div>
    </header>
  );
}
