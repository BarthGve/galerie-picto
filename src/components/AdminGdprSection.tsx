import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Mail, Calendar, Clock, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminGdprRequests, type GdprRequest, type GdprHistoryEntry } from "@/hooks/useGdprRequests";
import { Timeline, TimelineItem, TimelineDot, TimelineContent } from "@/components/ui/timeline";
import type { DotVariant } from "@/components/ui/timeline";

const RIGHT_TYPE_LABELS: Record<string, { title: string; desc: string }> = {
  acces: { title: "Droit d'accès", desc: "Obtenir une copie de vos données personnelles" },
  rectification: { title: "Droit de rectification", desc: "Corriger des données inexactes ou incomplètes" },
  effacement: { title: "Droit à l'effacement", desc: "Supprimer vos données personnelles" },
  portabilite: { title: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré" },
  opposition: { title: "Droit d'opposition", desc: "S'opposer au traitement de vos données" },
};

function RightTypeLabel({ rightType, titleClass, descClass }: { rightType: string; titleClass?: string; descClass?: string }) {
  const label = RIGHT_TYPE_LABELS[rightType];
  if (!label) return <span>{rightType}</span>;
  return (
    <>
      <span className={titleClass}>{label.title}</span>
      <span className={descClass ?? "text-xs text-muted-foreground font-normal ml-1"}>({label.desc})</span>
    </>
  );
}

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  nouveau: {
    label: "Nouveau",
    dotClass: "bg-primary",
    badgeClass: "bg-primary/10 text-primary dark:bg-primary/15",
  },
  en_cours: {
    label: "En cours",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  traite: {
    label: "Traité",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

const GDPR_STATUS_DOT_VARIANT: Record<string, DotVariant> = {
  nouveau: "blue",
  en_cours: "amber",
  traite: "emerald",
};

const GDPR_STATUS_TEXT_COLORS: Record<string, string> = {
  nouveau: "text-blue-600",
  en_cours: "text-amber-600",
  traite: "text-emerald-600",
};

const GDPR_ACTION_LABELS: Record<string, string> = {
  created: "Demande créée",
  status_changed: "Statut modifié",
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <span className="text-xs text-muted-foreground">{status}</span>;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${config.badgeClass}`}
    >
      <span className={`size-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FILTER_TABS: { label: string; value: string | undefined; count?: boolean }[] = [
  { label: "Toutes", value: undefined },
  { label: "Nouvelles", value: "nouveau", count: true },
  { label: "En cours", value: "en_cours" },
  { label: "Traitées", value: "traite" },
];

function GdprDetailPanel({
  request,
  onClose,
  onUpdateStatus,
  fetchHistory,
}: {
  request: GdprRequest;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string, responseMessage?: string) => Promise<void>;
  fetchHistory: (id: string) => Promise<GdprHistoryEntry[]>;
}) {
  const [history, setHistory] = useState<GdprHistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showTraiteDialog, setShowTraiteDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const loadHistory = useCallback(async () => {
    const h = await fetchHistory(request.id);
    setHistory(h);
  }, [fetchHistory, request.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleStatus(newStatus: string, response?: string) {
    setBusy(true);
    setStatusError(null);
    try {
      await onUpdateStatus(request.id, newStatus, response);
      await loadHistory();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Impossible de mettre à jour le statut.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTraite() {
    if (!responseMessage.trim()) return;
    await handleStatus("traite", responseMessage.trim());
    setShowTraiteDialog(false);
    setResponseMessage("");
  }

  // Find the "traite" history entry that contains the response
  const traiteEntry = history.find(
    (h) => h.toStatus === "traite" && h.detail,
  );

  return (
    <div className="bg-white rounded-[4px] border border-slate-100 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            <RightTypeLabel rightType={request.rightType} descClass="text-sm text-muted-foreground font-normal ml-1.5" />
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={request.status} />
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : détails + actions */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {request.requesterAvatar ? (
              <img src={request.requesterAvatar} alt="" className="w-6 h-6 rounded-full" decoding="async" />
            ) : (
              <div className="size-6 rounded-full bg-muted flex items-center justify-center">
                <User className="size-3 text-muted-foreground" />
              </div>
            )}
            <span>
              Demandé par <strong className="text-slate-700">@{request.requesterLogin}</strong>
              {request.requesterName && ` (${request.requesterName})`}
            </span>
            <span>· {formatDate(request.createdAt)}</span>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-[4px] p-4">
            {request.message}
          </p>

          {/* Métadonnées */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              <span className="font-medium text-foreground">Email :</span>
              {request.requesterEmail || "Non renseigné"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Consentement :</span>
              {request.consentContact ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Oui</span>
              ) : (
                <span className="text-destructive font-medium">Non</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3 shrink-0" />
              <span className="font-medium text-foreground">Mis à jour :</span>
              {formatDate(request.updatedAt)}
            </div>
          </div>

          {/* Réponse admin (affichée quand traité) */}
          {traiteEntry && (
            <div className="rounded-[4px] border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Réponse envoyée
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {traiteEntry.detail}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                {traiteEntry.actorAvatar ? (
                  <img src={traiteEntry.actorAvatar} alt="" className="size-5 rounded-full" decoding="async" />
                ) : (
                  <div className="size-5 rounded-full bg-muted" />
                )}
                <span>
                  Par <strong className="text-foreground">@{traiteEntry.actorLogin}</strong>
                  {traiteEntry.actorName && ` (${traiteEntry.actorName})`}
                </span>
                <span>· {formatDateTime(traiteEntry.createdAt)}</span>
              </div>
            </div>
          )}

          {/* Erreur changement de statut */}
          {statusError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
              {statusError}
            </div>
          )}

          {/* Actions */}
          {request.status !== "traite" && (
            <div className="flex flex-wrap gap-2">
              {request.status === "nouveau" && (
                <button
                  onClick={() => handleStatus("en_cours")}
                  disabled={busy}
                  className="px-4 py-2 rounded bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 disabled:opacity-50"
                >
                  Passer en cours
                </button>
              )}
              {request.status === "en_cours" && (
                <button
                  onClick={() => handleStatus("nouveau")}
                  disabled={busy}
                  className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 disabled:opacity-50"
                >
                  Remettre en nouveau
                </button>
              )}
              <button
                onClick={() => setShowTraiteDialog(true)}
                disabled={busy}
                className="px-4 py-2 rounded bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 disabled:opacity-50"
              >
                Marquer traité
              </button>
            </div>
          )}

          {/* Dialogue "Marquer traité" */}
          {showTraiteDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTraiteDialog(false)}>
              <div className="bg-white dark:bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Marquer comme traité
                  </h4>
                  <button onClick={() => setShowTraiteDialog(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Décrivez la réponse que vous avez envoyée au demandeur. Cette réponse sera conservée dans l'historique.
                </p>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Réponse envoyée au demandeur…"
                  rows={5}
                  maxLength={5000}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-y"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowTraiteDialog(false)}
                    className="px-4 py-2 rounded text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleTraite}
                    disabled={busy || !responseMessage.trim()}
                    className="px-4 py-2 rounded bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {busy ? "Envoi…" : "Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : historique */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Historique
          </h4>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucun historique.</p>
          ) : (
            <Timeline>
              {history.map((entry, idx) => {
                const toLabel = entry.toStatus ? STATUS_CONFIG[entry.toStatus]?.label : null;
                const dotVariant = GDPR_STATUS_DOT_VARIANT[entry.toStatus ?? ""] ?? "default";
                const isLast = idx === history.length - 1;
                return (
                  <TimelineItem key={entry.id} hideConnector={isLast}>
                    <TimelineDot variant={dotVariant} />
                    <TimelineContent>
                      <p className="text-xs font-bold text-slate-700">
                        {GDPR_ACTION_LABELS[entry.action] ?? entry.action}
                        {toLabel && (
                          <span className={`ml-1 font-semibold ${GDPR_STATUS_TEXT_COLORS[entry.toStatus ?? ""] ?? "text-slate-500"}`}>
                            {toLabel}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        {entry.actorAvatar && <img src={entry.actorAvatar} alt="" className="size-4 rounded-full shrink-0" decoding="async" />}
                        @{entry.actorLogin} · {formatDateTime(entry.createdAt)}
                      </p>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminGdprSection() {
  const {
    requests,
    total,
    loading,
    error,
    page,
    setPage,
    pageSize,
    statusFilter,
    setStatusFilter,
    updateStatus,
    newCount,
    fetchHistory,
  } = useAdminGdprRequests();

  const [selectedRequest, setSelectedRequest] = useState<GdprRequest | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (selectedRequest) {
    return (
      <GdprDetailPanel
        request={selectedRequest}
        onClose={() => {
          setSelectedRequest(null);
        }}
        onUpdateStatus={async (id, newStatus, responseMessage) => {
          await updateStatus(id, newStatus, responseMessage);
          // Update the selected request's status locally
          setSelectedRequest((prev) =>
            prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null,
          );
        }}
        fetchHistory={fetchHistory}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map(({ label, value, count }) => (
          <button
            key={label}
            onClick={() => {
              setStatusFilter(value);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
              statusFilter === value
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {label}
            {count && newCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {newCount > 99 ? "99+" : newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-destructive shrink-0" />
          {error}
        </div>
      )}

      {/* Liste de cards */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-card rounded-lg border border-slate-100 dark:border-border shadow-sm p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-3.5 w-28 rounded-full bg-muted" />
                    <div className="h-3.5 w-16 rounded-full bg-muted" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-3 w-20 rounded-full bg-muted" />
                    <div className="h-3 w-16 rounded-full bg-muted" />
                  </div>
                </div>
                <div className="h-7 w-20 rounded-lg bg-muted" />
              </div>
            </div>
          ))
        ) : requests.length > 0 ? (
          requests.map((req) => (
            <button
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="w-full text-left bg-white rounded-[4px] border border-slate-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {req.requesterAvatar ? (
                  <img
                    src={req.requesterAvatar}
                    alt=""
                    width={32}
                    height={32}
                    decoding="async"
                    className="size-8 rounded-full shrink-0"
                  />
                ) : (
                  <div className="size-8 rounded-full bg-muted shrink-0 flex items-center justify-center">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                )}

                {/* Infos principales */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">
                      <RightTypeLabel rightType={req.rightType} />
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-xs text-slate-400">
                    <span>{req.requesterName || req.requesterLogin}</span>
                    <span> · {formatDate(req.createdAt)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white dark:bg-card rounded-lg border border-slate-100 dark:border-border shadow-sm py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune demande RGPD.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="tabular-nums">
            {total} demande{total > 1 ? "s" : ""} — page {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="outline"
              className="rounded-lg"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              className="rounded-lg"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
