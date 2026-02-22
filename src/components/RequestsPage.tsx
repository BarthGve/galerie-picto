import { useState, useEffect, useCallback } from "react";
import { MessageSquarePlus, MessageSquare, Clock, ChevronRight, Upload, X, Loader2, Send, Paperclip } from "lucide-react";
import { useRequests } from "@/hooks/useRequests";
import { toast } from "sonner";
import type { PictoRequest, PictoRequestComment } from "@/lib/types";
import { Timeline, TimelineItem, TimelineDot, TimelineContent } from "@/components/ui/timeline";
import {
  STATUS_LABELS, ACTION_LABELS, STATUS_DOT_VARIANT, STATUS_TEXT_COLORS,
  formatDateTime, StatusBadge,
  type HistoryEntry,
} from "@/lib/request-constants";

function RequestForm({
  onSubmit,
  onCancel,
  uploadReferenceImage,
}: {
  onSubmit: (data: { title: string; description: string; referenceImageKey?: string; urgency?: "normale" | "urgente" }) => Promise<void>;
  onCancel: () => void;
  uploadReferenceImage: (file: File) => Promise<string | null>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"normale" | "urgente">("normale");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format accepté : JPEG, PNG ou WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (max 2 Mo)");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);

    try {
      let referenceImageKey: string | undefined;
      if (imageFile) {
        const key = await uploadReferenceImage(imageFile);
        if (!key) {
          toast.error("Erreur lors de l'upload de l'image");
          setSubmitting(false);
          return;
        }
        referenceImageKey = key;
      }
      await onSubmit({ title: title.trim(), description: description.trim(), referenceImageKey, urgency });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne gauche : Titre + Description */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder="Ex: Pictogramme représentant un drone"
              className="w-full rounded-[4px] border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/150</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Décrivez le pictogramme souhaité, les éléments importants..."
              className="w-full rounded-[4px] border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all resize-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/2000</p>
          </div>
        </div>

        {/* Colonne droite : Image + Urgence */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Image d'inspiration</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Aperçu" className="w-full max-h-40 object-contain rounded-[4px] border border-border bg-muted/30" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-[4px] border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">JPEG, PNG ou WebP — max 2 Mo</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Urgence</label>
            <div className="flex gap-3">
              {(["normale", "urgente"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`px-4 py-2 rounded-[4px] text-sm font-medium border transition-colors ${
                    urgency === u
                      ? u === "urgente"
                        ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-400"
                      : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {u === "normale" ? "Normale" : "Urgente"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-[4px] border border-border text-muted-foreground font-medium text-sm hover:bg-accent"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim() || !description.trim()}
          className="px-5 py-2.5 rounded-[4px] bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer la demande
        </button>
      </div>
    </form>
  );
}

function RequestDetail({
  request,
  onBack,
  getComments,
  addComment,
  getHistory,
}: {
  request: PictoRequest;
  onBack: () => void;
  getComments: (id: string) => Promise<PictoRequestComment[]>;
  addComment: (id: string, content: string) => Promise<boolean>;
  getHistory: (id: string) => Promise<HistoryEntry[]>;
}) {
  const [comments, setComments] = useState<PictoRequestComment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getComments(request.id).then(setComments);
    getHistory(request.id).then(setHistory);
  }, [request.id, getComments, getHistory]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    const ok = await addComment(request.id, newComment.trim());
    if (ok) {
      setNewComment("");
      const updated = await getComments(request.id);
      setComments(updated);
    } else {
      toast.error("Erreur lors de l'envoi du commentaire");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-indigo-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
        &larr; Retour à mes demandes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche 2/3 : détail + commentaires */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[4px] border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-extrabold text-tertiary">{request.title}</h2>
              <StatusBadge status={request.status} />
            </div>

            <div className={`grid gap-6 ${request.referenceImageUrl ? "grid-cols-1 md:grid-cols-[2fr_1fr]" : ""}`}>
              <div className="space-y-4">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{request.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Créée le {new Date(request.createdAt!).toLocaleDateString("fr-FR")}</span>
                  {request.assignedTo && <span>Assignée à <strong className="text-slate-600">{request.assignedTo}</strong></span>}
                </div>
              </div>

              {request.referenceImageUrl && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">Image d'inspiration</p>
                  <img
                    src={request.referenceImageUrl}
                    alt="Image de référence"
                    className="w-full rounded-[4px] object-contain"
                    decoding="async"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Commentaires */}
          <div className="bg-white rounded-[4px] border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-tertiary flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              Commentaires ({comments.length})
            </h3>

            {comments.length === 0 && (
              <p className="text-sm text-slate-400">Aucun commentaire pour le moment.</p>
            )}

            <div className="space-y-3">
              {comments.map((c) => {
                const isDelivery = /^(📎\s*)?Pictogramme livré/i.test(c.content);
                const lines = c.content.split("\n");
                const textLine = isDelivery ? lines[0].replace(/^📎\s*/, "") : c.content;
                const svgUrl = isDelivery ? lines.find((l) => /^https:\/\/cdn\.kerjean\.net\/\S+\.svg$/i.test(l.trim())) : undefined;
                return (
                  <div key={c.id} className="flex gap-3">
                    {c.authorAvatar && (
                      <img src={c.authorAvatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
                    )}
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
            </div>

            {request.status !== "refusee" && request.status !== "livree" && (
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
                    onClick={handleSend}
                    disabled={sending || !newComment.trim()}
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Envoyer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite 1/3 : historique */}
        <div className="space-y-3">
          <div className="bg-white rounded-[4px] border border-slate-100 shadow-sm p-6 space-y-3">
            <h4 className="text-sm font-bold text-tertiary flex items-center gap-1.5">
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
                          {entry.action === "assigned" && entry.detail && entry.detail !== entry.actorLogin && (
                            <span className="ml-1 font-semibold text-indigo-600 inline-flex items-center gap-1">
                              à
                              {entry.detailAvatar && <img src={entry.detailAvatar} alt="" className="size-4 rounded-full inline" decoding="async" />}
                              {entry.detailName || entry.detail}
                            </span>
                          )}
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
      </div>
    </div>
  );
}

export function RequestsPage({
  isAuthenticated,
  onLogin,
}: {
  isAuthenticated: boolean;
  onLogin: () => void;
}) {
  const {
    requests,
    loading,
    fetchRequests,
    createRequest,
    getRequestDetail,
    getComments,
    addComment,
    getHistory,
    uploadReferenceImage,
  } = useRequests(isAuthenticated);

  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [selectedRequest, setSelectedRequest] = useState<PictoRequest | null>(null);

  const handleCreate = useCallback(async (data: { title: string; description: string; referenceImageKey?: string; urgency?: "normale" | "urgente" }) => {
    const id = await createRequest(data);
    if (id) {
      toast.success("Demande envoyée !");
      setView("list");
    } else {
      toast.error("Erreur lors de la création");
    }
  }, [createRequest]);

  const handleViewDetail = useCallback(async (id: string) => {
    const detail = await getRequestDetail(id);
    if (detail) {
      setSelectedRequest(detail);
      setView("detail");
    }
  }, [getRequestDetail]);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <MessageSquarePlus className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-extrabold text-slate-900">Demander un pictogramme</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            Connectez-vous avec GitHub pour soumettre une demande de pictogramme.
          </p>
          <button
            onClick={onLogin}
            className="px-6 py-2.5 rounded bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="flex-1 overflow-y-auto pb-12">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-tertiary mb-6">
            Nouvelle demande
          </h2>
          <RequestForm
            onSubmit={handleCreate}
            onCancel={() => setView("list")}
            uploadReferenceImage={uploadReferenceImage}
          />
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedRequest) {
    return (
      <div className="flex-1 overflow-y-auto pb-12">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6">
          <RequestDetail
            request={selectedRequest}
            onBack={() => { setView("list"); fetchRequests(); }}
            getComments={getComments}
            addComment={addComment}
            getHistory={getHistory}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-12">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-tertiary">
            Mes demandes de picto
          </h2>
          <button
            onClick={() => setView("form")}
            className="px-5 py-2.5 rounded bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:bg-primary/80 flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Nouvelle demande
          </button>
        </div>

        {loading && requests.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm">Vous n'avez pas encore de demande.</p>
            <button
              onClick={() => setView("form")}
              className="text-sm font-bold text-indigo-600 hover:underline"
            >
              Créer ma première demande
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => handleViewDetail(r.id)}
                className="w-full text-left rounded-[4px] p-4 hover:bg-accent/60 transition-all flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 truncate">{r.title}</span>
                    <StatusBadge status={r.status} />
                    {r.urgency === "urgente" && (
                      <span className="text-xs font-bold text-red-500">URGENT</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(r.createdAt!).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {r.referenceImageUrl && (
                  <img
                    src={r.referenceImageUrl}
                    alt=""
                    className="w-10 h-10 rounded-[4px] object-cover shrink-0 bg-slate-100"
                    decoding="async"
                    width={40}
                    height={40}
                  />
                )}
                {r.status === "livree" && r.deliveredPictogramUrl && (
                  <img
                    src={r.deliveredPictogramUrl}
                    alt="Picto livré"
                    className="w-10 h-10 shrink-0 bg-slate-50 rounded-[4px] p-0.5"
                    decoding="async"
                    width={40}
                    height={40}
                  />
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
