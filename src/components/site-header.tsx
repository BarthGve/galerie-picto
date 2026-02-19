import { Moon, Search, Sun, Bell, Bug, Sparkles, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/use-theme";
import type { FeedbackNotification } from "@/hooks/useFeedbackNotifications";

export function SiteHeader({
  onSearch,
  totalCount,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onGoFeedback,
  isAuthenticated,
}: {
  onSearch: (query: string) => void;
  totalCount: number;
  notifications?: FeedbackNotification[];
  unreadCount?: number;
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
  onGoFeedback?: () => void;
  isAuthenticated?: boolean;
}) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), 250);
  };

  const hasNotifs = (unreadCount ?? 0) > 0;
  const notifList = notifications ?? [];

  function handleBellClick() {
    setBellOpen((v) => !v);
  }

  function handleNotifClick(n: FeedbackNotification) {
    onMarkRead?.(n.id);
    setBellOpen(false);
    onGoFeedback?.();
  }

  return (
    <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 px-6 py-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={`Rechercher parmi ${totalCount} pictogrammes...`}
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
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setBellOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded border border-border bg-popover shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-semibold text-sm">Notifications</span>
                    {notifList.length > 0 && (
                      <button
                        onClick={() => {
                          onMarkAllRead?.();
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifList.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8 px-4">
                        Pas de nouvelle pour le moment. On vous prévient dès
                        qu'un de vos signalements est traité.
                      </p>
                    ) : (
                      notifList.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
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
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
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
