import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { Loader2, UserCheck, MessageSquare, X, Check, AlertTriangle, Send, Clock, Paperclip } from "lucide-react";
import { useAdminRequests } from "@/hooks/useRequests";
import { toast } from "sonner";
import type { PictoRequest, PictoRequestStatus, PictoRequestComment } from "@/lib/types";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import { Timeline, TimelineItem, TimelineDot, TimelineContent } from "@/components/ui/timeline";
import {
  STATUS_LABELS,
  ACTION_LABELS,
  STATUS_DOT_VARIANT,
  STATUS_TEXT_COLORS,
  formatDateTime,
  StatusBadge,
  type HistoryEntry,
} from "@/lib/request-constants";

const UploadDialog = lazy(() => import("@/components/UploadDialog").then(m => ({ default: m.UploadDialog })));

const FILTER_TABS: { value: PictoRequestStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "nouvelle", label: "Nouvelles" },
  { value: "en_cours", label: "En cours" },
  { value: "precisions_requises", label: "Précisions" },
  { value: "livree", label: "Livrées" },
  { value: "refusee", label: "Refusées" },
];

function RequestDetailPanel({
  request,
  onClose,
  onAssign,
  onUpdateStatus,
}: {
  request: PictoRequest;
  onClose: () => void;
  onAssign: (id: string) => Promise<boolean>;
  onUpdateStatus: (id: string, status: PictoRequestStatus, extra?: { rejectionReason?: string; comment?: string; deliveredPictogramId?: string }) => Promise<boolean>;
}) {
  const [comments, setComments] = useState<PictoRequestComment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [precisionComment, setPrecisionComment] = useState("");
  const [showPrecisionForm, setShowPrecisionForm] = useState(false);
  const [showUploadForDelivery, setShowUploadForDelivery] = useState(false);

  // Decode user from JWT for UploadDialog
  const user = (() => {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as { login?: string; avatar_url?: string };
      if (payload.login && payload.avatar_url) return { login: payload.login, avatar_url: payload.avatar_url };
    } catch { /* ignore */ }
    return null;
  })();

  const fetchComments = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/requests/${request.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch { /* ignore */ }
  }, [request.id]);

  const fetchHistory = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/requests/${request.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch { /* ignore */ }
  }, [request.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching pattern: fetch then setState in .then()
    fetchComments(); fetchHistory();
  }, [fetchComments, fetchHistory]);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    const token = getStoredToken();
    if (!token) { setSending(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/requests/${request.id}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment("");
        await fetchComments();
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Le motif de refus est obligatoire");
      return;
    }
    const ok = await onUpdateStatus(request.id, "refusee", { rejectionReason: rejectionReason.trim(), comment: rejectionReason.trim() });
    if (ok) {
      toast.success("Demande refusée");
      await fetchComments();
      afterAction();
    }
  };

  const handlePrecision = async () => {
    if (!precisionComment.trim()) {
      toast.error("Le commentaire est obligatoire pour demander des précisions");
      return;
    }
    const ok = await onUpdateStatus(request.id, "precisions_requises", { comment: precisionComment.trim() });
    if (ok) {
      toast.success("Précisions demandées");
      setPrecisionComment("");
      setShowPrecisionForm(false);
      await fetchComments();
      afterAction();
    }
  };

  const afterAction = () => { fetchHistory(); };

  return (
    <div className="bg-white rounded-[4px] border border-slate-100 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">{request.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={request.status} />
            {request.urgency === "urgente" && (
              <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> URGENT
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : détails + actions + commentaires */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {request.requesterAvatar && (
              <img src={request.requesterAvatar} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span>Demandé par <strong className="text-slate-700">{request.requesterName || request.requesterLogin}</strong></span>
            <span>· {new Date(request.createdAt!).toLocaleDateString("fr-FR")}</span>
          </div>

          <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-[4px] p-4">{request.description}</p>

          {/* Image de référence */}
          {request.referenceImageUrl && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Image de référence</p>
              <img
                src={request.referenceImageUrl}
                alt="Référence"
                className="max-h-64 rounded-[4px] border border-slate-200 object-contain"
                decoding="async"
              />
            </div>
          )}

          {/* Actions */}
          {request.status !== "livree" && request.status !== "refusee" && (
            <div className="flex flex-wrap gap-2">
              {!request.assignedTo && (
                <button
                  onClick={async () => {
                    const ok = await onAssign(request.id);
                    if (ok) { toast.success("Demande assignée"); afterAction(); }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Me l'assigner
                </button>
              )}
              {request.status === "en_cours" && (
                <>
                  {!showPrecisionForm ? (
                    <button
                      onClick={() => setShowPrecisionForm(true)}
                      className="px-4 py-2 rounded-xl bg-orange-50 text-orange-700 font-bold text-sm hover:bg-orange-100"
                    >
                      Demander des précisions
                    </button>
                  ) : (
                    <div className="w-full flex gap-2 mt-2">
                      <input
                        value={precisionComment}
                        onChange={(e) => setPrecisionComment(e.target.value)}
                        placeholder="Quelles précisions souhaitez-vous ?"
                        className="flex-1 rounded-[4px] border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button onClick={handlePrecision} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm">
                        Confirmer
                      </button>
                      <button onClick={() => setShowPrecisionForm(false)} className="px-3 py-2 text-sm text-slate-500">
                        Annuler
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setShowUploadForDelivery(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Marquer livrée
                  </button>
                </>
              )}
              {request.status === "precisions_requises" && (
                <button
                  onClick={async () => {
                    const ok = await onUpdateStatus(request.id, "en_cours");
                    if (ok) { toast.success("Reprise en cours"); afterAction(); }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100"
                >
                  Reprendre en cours
                </button>
              )}
              {!showRejectForm ? (
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100"
                >
                  Refuser
                </button>
              ) : (
                <div className="w-full flex gap-2 mt-2">
                  <input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motif du refus..."
                    className="flex-1 rounded-[4px] border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button onClick={handleReject} className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-sm">
                    Confirmer
                  </button>
                  <button onClick={() => setShowRejectForm(false)} className="px-3 py-2 text-sm text-slate-500">
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Commentaires */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              Commentaires ({comments.length})
            </h4>

            {comments.map((c) => {
              const isDelivery = /^(📎\s*)?Pictogramme livré/i.test(c.content);
              const lines = c.content.split("\n");
              const textLine = isDelivery ? lines[0].replace(/^📎\s*/, "") : c.content;
              const svgUrl = isDelivery ? lines.find((l) => /^https:\/\/cdn\.kerjean\.net\/\S+\.svg$/i.test(l.trim())) : undefined;
              return (
                <div key={c.id} className="flex gap-3">
                  {c.authorAvatar && <img src={c.authorAvatar} alt="" className="w-7 h-7 rounded-full shrink-0" />}
                  <div className="flex-1 bg-slate-50 rounded-[4px] p-3">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-700">{c.authorName || c.authorLogin}</span>
                      <span className="text-xs text-slate-400">{new Date(c.createdAt!).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap flex items-center gap-1.5">
                      {isDelivery && <Paperclip className="size-3.5 shrink-0 text-slate-400" />}
                      {textLine}
                    </p>
                    {svgUrl && (
                      <img src={svgUrl.trim()} alt="Pictogramme livré" className="mt-2 w-24 h-24 object-contain rounded bg-white border border-slate-200 p-1" decoding="async" />
                    )}
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="Ajouter un commentaire..."
                className="w-full rounded-[4px] border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSendComment}
                  disabled={sending || !newComment.trim()}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Envoyer
                </button>
              </div>
            </div>
          </div>
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
                const toLabel = entry.toStatus ? STATUS_LABELS[entry.toStatus]?.label : null;
                const dotVariant = STATUS_DOT_VARIANT[entry.toStatus ?? ""] ?? "default";
                const isLast = idx === history.length - 1;
                return (
                  <TimelineItem key={entry.id} hideConnector={isLast}>
                    <TimelineDot variant={dotVariant} />
                    <TimelineContent>
                      <p className="text-xs font-bold text-slate-700">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                        {toLabel && (
                          <span className={`ml-1 font-semibold ${STATUS_TEXT_COLORS[entry.toStatus ?? ""] ?? "text-slate-500"}`}>
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

      {showUploadForDelivery && (
        <Suspense fallback={null}>
          <UploadDialog
            open={showUploadForDelivery}
            onOpenChange={setShowUploadForDelivery}
            user={user}
            onUploadSuccess={async (info) => {
              if (!info) return;
              const comment = `Pictogramme livré : ${info.filename}\n${info.url}`;
              const ok = await onUpdateStatus(request.id, "livree", { deliveredPictogramId: info.pictogramId, comment });
              if (ok) {
                toast.success("Demande livrée !");
                await fetchComments();
                afterAction();
              }
              setShowUploadForDelivery(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export function AdminRequestsSection() {
  const { requests, loading, fetchAll, assignToMe, updateStatus, getRequestDetail } = useAdminRequests();
  const [filter, setFilter] = useState<PictoRequestStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<PictoRequest | null>(null);

  useEffect(() => {
    fetchAll(filter === "all" ? undefined : filter);
  }, [filter, fetchAll]);

  const handleSelectRequest = useCallback(async (r: PictoRequest) => {
    // Fetch full detail
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/requests/${r.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data.request);
      }
    } catch { /* ignore */ }
  }, []);

  if (selectedRequest) {
    return (
      <RequestDetailPanel
        request={selectedRequest}
        onClose={() => {
          setSelectedRequest(null);
          fetchAll(filter === "all" ? undefined : filter);
        }}
        onAssign={async (id) => {
          const ok = await assignToMe(id);
          if (ok) {
            const updated = await getRequestDetail(id);
            if (updated) setSelectedRequest(updated);
          }
          return ok;
        }}
        onUpdateStatus={async (id, status, extra) => {
          const ok = await updateStatus(id, status, extra);
          if (ok) {
            const updated = await getRequestDetail(id);
            if (updated) setSelectedRequest(updated);
          }
          return ok;
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-1 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === tab.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && requests.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Aucune demande.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectRequest(r)}
              className="w-full text-left bg-white rounded-[4px] border border-slate-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                {r.requesterAvatar && (
                  <img src={r.requesterAvatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 truncate">{r.title}</span>
                    <StatusBadge status={r.status} />
                    {r.urgency === "urgente" && (
                      <span className="text-xs font-bold text-red-500">URGENT</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    <span>{r.requesterName || r.requesterLogin}</span>
                    <span> · {new Date(r.createdAt!).toLocaleDateString("fr-FR")}</span>
                    {r.assignedTo && <span> · Assigné à {r.assignedTo}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
