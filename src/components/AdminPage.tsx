import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Image,
  Users,
  Download,
  MessageSquare,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Ban,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminUsers, type AdminUser } from "@/hooks/useAdminUsers";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 animate-pulse">
      <div className="h-3 w-24 rounded bg-muted mb-3" />
      <div className="h-7 w-16 rounded bg-muted" />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-primary">
        {value.toLocaleString("fr-FR")}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TopList({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string; count: number }[];
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-base font-extrabold tracking-tight text-tertiary mb-3">{title}</h3>
        <p className="text-xs text-muted-foreground">Aucune donnée.</p>
      </div>
    );
  }
  const max = items[0].count;
  return (
    <div>
      <h3 className="text-base font-extrabold tracking-tight text-tertiary mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
          return (
            <div key={item.id} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium truncate max-w-[70%]">
                  <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                  {item.name}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {item.count.toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserRow({
  user,
  onBan,
  onUnban,
  onDelete,
}: {
  user: AdminUser;
  onBan: (login: string) => void;
  onUnban: (login: string) => void;
  onDelete: (login: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(action: () => void | Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (
      window.confirm(
        `Supprimer définitivement @${user.githubLogin} ?\n\nCette action est irréversible et supprimera aussi ses pictogrammes, favoris, collections et likes.`,
      )
    ) {
      void handle(() => onDelete(user.githubLogin));
    }
  }

  const isBanned = !!user.bannedAt;

  return (
    <tr className={`border-b border-border last:border-0 ${isBanned ? "bg-destructive/5" : ""}`}>
      {/* Avatar + login */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {user.githubAvatarUrl ? (
            <img
              src={user.githubAvatarUrl}
              alt=""
              width={28}
              height={28}
              decoding="async"
              className="size-7 rounded-full border border-border shrink-0"
            />
          ) : (
            <div className="size-7 rounded-full bg-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              @{user.githubLogin}
              {isBanned && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-destructive">
                  <Ban className="size-2.5" /> banni
                </span>
              )}
            </p>
            {user.githubName && (
              <p className="text-[11px] text-muted-foreground truncate">{user.githubName}</p>
            )}
          </div>
        </div>
      </td>

      {/* Stats */}
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-foreground">{user.favoritesCount}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-foreground">{user.likesCount}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-foreground">{user.userPictogramsCount}</span>
      </td>

      {/* Dates */}
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(user.firstSeenAt)}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(user.lastSeenAt)}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 justify-end">
          {isBanned ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] gap-1"
              disabled={busy}
              onClick={() => void handle(() => onUnban(user.githubLogin))}
            >
              <ShieldCheck className="size-3" />
              Débannir
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
              disabled={busy}
              onClick={() => void handle(() => onBan(user.githubLogin))}
            >
              <Ban className="size-3" />
              Bannir
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={busy}
            onClick={confirmDelete}
          >
            <Trash2 className="size-3" />
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
  );
}

function UsersSection() {
  const { result, loading, error, page, setPage, pageSize, handleSearchChange, ban, unban, removeUser } =
    useAdminUsers();
  const searchRef = useRef<HTMLInputElement>(null);

  const totalPages = result ? Math.ceil(result.total / pageSize) : 1;

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Rechercher par login ou nom…"
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="py-2.5 px-4 text-[11px] font-semibold text-primary uppercase tracking-wide">
                  Utilisateur
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-primary uppercase tracking-wide text-center">
                  Favoris
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-primary uppercase tracking-wide text-center">
                  Likes
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-primary uppercase tracking-wide text-center">
                  Pictos
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-primary uppercase tracking-wide">
                  Inscrit le
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-primary uppercase tracking-wide">
                  Vu le
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-primary uppercase tracking-wide text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0 animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-muted shrink-0" />
                        <div className="h-3 w-28 rounded bg-muted" />
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-3 w-10 rounded bg-muted mx-auto" />
                      </td>
                    ))}
                    <td className="py-3 px-4">
                      <div className="h-7 w-32 rounded bg-muted ml-auto" />
                    </td>
                  </tr>
                ))
              ) : result && result.users.length > 0 ? (
                result.users.map((user) => (
                  <UserRow
                    key={user.githubLogin}
                    user={user}
                    onBan={ban}
                    onUnban={unban}
                    onDelete={removeUser}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {result && result.total > pageSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {result.total.toLocaleString("fr-FR")} utilisateur{result.total > 1 ? "s" : ""} —
            page {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const { stats, loading, error, refetch } = useAdminStats();
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users">("dashboard");

  useEffect(() => {
    fetch(`${API_URL}/api/feedback`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items: { status: string }[]) => {
        setOpenTickets(items.filter((i) => i.status === "open").length);
      })
      .catch(() => setOpenTickets(null));
  }, []);

  const [invalidating, setInvalidating] = useState(false);
  const [invalidated, setInvalidated] = useState(false);

  async function handleInvalidateCache() {
    const token = getStoredToken();
    if (!token) return;
    setInvalidating(true);
    setInvalidated(false);
    try {
      await fetch(`${API_URL}/api/admin/cache/invalidate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvalidated(true);
      setTimeout(() => setInvalidated(false), 3000);
      refetch();
    } catch {
      // silently ignore
    } finally {
      setInvalidating(false);
    }
  }

  return (
    <div className="min-h-full pb-16">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <LayoutDashboard className="size-3.5" />
              Administration
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">
              Tableau de bord
            </h1>
          </div>
          {activeTab === "dashboard" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded gap-2"
              onClick={handleInvalidateCache}
              disabled={invalidating}
            >
              {invalidated ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  Cache invalidé
                </>
              ) : (
                <>
                  <RefreshCw className={`size-3.5 ${invalidating ? "animate-spin" : ""}`} />
                  Invalider le cache
                </>
              )}
            </Button>
          )}
        </div>

        {/* Onglets */}
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "dashboard"
                ? "border-tertiary text-tertiary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <LayoutDashboard className="size-3.5" />
              Dashboard
            </span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "users"
                ? "border-tertiary text-tertiary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              Utilisateurs
              {stats && (
                <span className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 leading-none">
                  {stats.users.total}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Contenu Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : stats ? (
                <>
                  <KpiCard icon={Image} label="Pictogrammes" value={stats.pictograms.total} />
                  <KpiCard
                    icon={Users}
                    label="Utilisateurs"
                    value={stats.users.total}
                    sub={`${stats.users.activeLast30Days} actifs (30j)`}
                  />
                  <KpiCard icon={Download} label="Téléchargements" value={stats.downloads.total} />
                  <KpiCard
                    icon={MessageSquare}
                    label="Tickets ouverts"
                    value={openTickets ?? "—"}
                  />
                </>
              ) : null}
            </div>

            {/* Tops */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-xl border border-border bg-card p-5 animate-pulse">
                {[0, 1].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-3 w-32 rounded bg-muted" />
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-2.5 rounded bg-muted" />
                        <div className="h-1 rounded-full bg-muted" style={{ width: `${100 - j * 12}%` }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-xl border border-border bg-card p-5">
                <div className="space-y-6">
                  <TopList title="Top téléchargements" items={stats.downloads.topPictograms} />
                  {stats.pictograms.neverDownloaded.length > 0 && (
                    <div>
                      <h3 className="text-base font-extrabold tracking-tight text-tertiary mb-3 flex items-center gap-2">
                        Jamais téléchargés
                        <span className="inline-flex items-center justify-center rounded-full bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 leading-none">
                          {stats.pictograms.neverDownloaded.length}
                        </span>
                      </h3>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {stats.pictograms.neverDownloaded.map((p, idx) => (
                          <div key={p.id} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                            <span className="text-foreground truncate">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <TopList title="Top likes" items={stats.likes.topPictograms} />
              </div>
            ) : null}

            {/* Activité récente */}
            {loading ? (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-pulse">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-2.5 w-40 rounded bg-muted" />
                      <div className="h-2.5 w-20 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            ) : stats ? (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-base font-extrabold tracking-tight text-tertiary">
                  Activité récente
                </h3>
                <div className="space-y-3">
                  {stats.recentPictograms.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Derniers pictogrammes
                      </p>
                      <div className="space-y-1.5">
                        {stats.recentPictograms.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-foreground font-medium truncate max-w-[70%]">
                              {p.name}
                            </span>
                            <span className="text-muted-foreground shrink-0">
                              {formatDate(p.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.users.recentSignups.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Derniers inscrits
                      </p>
                      <div className="space-y-1.5">
                        {stats.users.recentSignups.map((u) => (
                          <div key={u.githubLogin} className="flex items-center gap-2 text-xs">
                            {u.githubAvatarUrl ? (
                              <img
                                src={u.githubAvatarUrl}
                                alt=""
                                width={20}
                                height={20}
                                decoding="async"
                                className="size-5 rounded-full border border-border shrink-0"
                              />
                            ) : (
                              <div className="size-5 rounded-full bg-muted shrink-0" />
                            )}
                            <span className="text-foreground font-medium flex-1 truncate">
                              @{u.githubLogin}
                            </span>
                            <span className="text-muted-foreground shrink-0">
                              {formatDate(u.firstSeenAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Contenu Utilisateurs */}
        {activeTab === "users" && <UsersSection />}
      </div>
    </div>
  );
}
