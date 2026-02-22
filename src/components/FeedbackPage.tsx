import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import {
  Bug,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Github,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from "@/lib/config";
import { getStoredToken, type GitHubUser } from "@/lib/github-auth";

interface FeedbackComment {
  author: string;
  body: string;
  createdAt: string;
}

interface FeedbackItem {
  id: number;
  type: "bug" | "improvement";
  title: string;
  reportedBy: string;
  createdAt: string;
  status: "open" | "resolved";
  resolution?: string;
  url: string;
  fields?: Record<string, string>;
  comments?: FeedbackComment[];
}

type FormType = "bug" | "improvement";
type View = "list" | "form";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Issue list ───────────────────────────────────────────────────────────────

function IssuesList({
  user,
  onLogin,
  onSignal,
  isCollaborator,
}: {
  user: GitHubUser | null;
  onLogin: () => void;
  onSignal: () => void;
  isCollaborator: boolean;
}) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/feedback`)
      .then((r) => {
        if (!r.ok) throw new Error("Erreur de chargement");
        return r.json() as Promise<FeedbackItem[]>;
      })
      .then(setItems)
      .catch(() => setError("Impossible de charger les signalements."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* CTA Banner */}
      {user ? (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Vous voyez un problème ou avez une idée ?
          </p>
          <button
            onClick={onSignal}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:bg-primary/80 flex items-center gap-2"
          >
            <Send className="size-3.5" />
            Initier un ticket
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-background px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-primary text-sm flex items-center gap-1.5">
              <Github className="size-4" />
              Participez au projet !
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connectez-vous avec GitHub pour signaler un bug ou suggérer une
              amélioration.
            </p>
          </div>
          <button
            onClick={onLogin}
            className="text-sm font-bold text-primary flex items-center gap-1.5 hover:gap-2.5 transition-all shrink-0"
          >
            Se connecter <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* List */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Aucun signalement pour l'instant.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <IssueRow key={item.id} item={item} isCollaborator={isCollaborator} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Issue row with expandable details ────────────────────────────────────────

function IssueRow({
  item,
  isCollaborator,
}: {
  item: FeedbackItem;
  isCollaborator: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fields = item.fields ?? {};
  const hasFields = Object.keys(fields).length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 rounded-lg flex items-start gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
      >
        <div className="mt-0.5 shrink-0">
          {item.type === "bug" ? (
            <Bug className="size-4 text-orange-500" />
          ) : (
            <Sparkles className="size-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {item.title}
            </span>
            {item.status === "resolved" ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 shrink-0">
                <CheckCircle2 className="size-3 mr-1" />
                Résolu
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300 bg-orange-50 text-[10px] px-1.5 py-0 shrink-0"
              >
                <Clock className="size-3 mr-1" />
                En cours
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Signalé par{" "}
            <span className="font-medium">@{item.reportedBy}</span>
            {" · "}
            {formatDate(item.createdAt)}
          </p>
        </div>
      </button>

      {open && (
        <div className="px-11 pb-4 space-y-3">
          {hasFields &&
            Object.entries(fields).map(([label, content]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  {label}
                </p>
                <div className="text-sm text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic">
                  <Markdown>{content}</Markdown>
                </div>
              </div>
            ))}

          {item.comments && item.comments.length > 0 && (
            <div className={hasFields ? "pt-2 border-t border-border space-y-3" : "space-y-3"}>
              <p className="text-xs font-semibold text-foreground">
                Commentaires
              </p>
              {item.comments.map((c, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">@{c.author}</span>
                    {" · "}
                    {formatDate(c.createdAt)}
                  </p>
                  <div className="text-sm text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic">
                    <Markdown>{c.body}</Markdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasFields && (!item.comments || item.comments.length === 0) && (
            <p className="text-sm text-muted-foreground italic">
              Aucun détail disponible.
            </p>
          )}

          {isCollaborator && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-block"
            >
              Voir sur GitHub
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bug form ─────────────────────────────────────────────────────────────────

function BugForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [impact, setImpact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 && description.trim().length > 0 && impact !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "bug",
          title: title.trim(),
          fields: { description, steps, expected, impact },
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Erreur lors de l'envoi");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="En quelques mots, quel est le problème ?"
        required
        hint={`${title.length}/100`}
      >
        <input
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Le téléchargement PNG ne fonctionne pas"
          className={inputCls}
        />
      </Field>

      <Field label="Décrivez ce qui s'est passé" required>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Expliquez ce que vous avez constaté..."
          className={textareaCls}
        />
      </Field>

      <Field
        label="Comment reproduire le problème ?"
        hint="optionnel"
      >
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={2}
          placeholder="1. J'ai cliqué sur... 2. Ensuite..."
          className={textareaCls}
        />
      </Field>

      <Field label="Qu'est-ce que vous attendiez ?" hint="optionnel">
        <textarea
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          rows={2}
          placeholder="Le fichier aurait dû se télécharger..."
          className={textareaCls}
        />
      </Field>

      <Field label="Est-ce que cela vous bloque ?" required>
        <Select value={impact} onValueChange={setImpact}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
          <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
            <SelectItem value="Bloquant — je ne peux plus utiliser l'outil">
              Oui, je ne peux plus utiliser l'outil
            </SelectItem>
            <SelectItem value="Gênant — mais je peux continuer à travailler">
              C'est gênant mais je peux continuer
            </SelectItem>
            <SelectItem value="Mineur — c'est un petit détail">
              C'est un petit détail
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Envoyer le signalement
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Improvement form ─────────────────────────────────────────────────────────

function ImprovementForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 &&
    context.trim().length > 0 &&
    description.trim().length > 0 &&
    importance !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "improvement",
          title: title.trim(),
          fields: { context, description, importance },
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Erreur lors de l'envoi");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="En quelques mots, quelle amélioration souhaitez-vous ?"
        required
        hint={`${title.length}/100`}
      >
        <input
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Pouvoir filtrer par couleur"
          className={inputCls}
        />
      </Field>

      <Field
        label="Pourquoi cette amélioration vous serait-elle utile ?"
        required
      >
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          placeholder="Expliquez votre besoin..."
          className={textareaCls}
        />
      </Field>

      <Field label="Comment imaginez-vous cette amélioration ?" required>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Décrivez ce que vous aimeriez voir..."
          className={textareaCls}
        />
      </Field>

      <Field label="À quel point est-ce important pour vous ?" required>
        <Select value={importance} onValueChange={setImportance}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
          <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
            <SelectItem value="Indispensable — j'en ai vraiment besoin">
              Indispensable pour moi
            </SelectItem>
            <SelectItem value="Utile — ça m'aiderait beaucoup">
              Ça m'aiderait beaucoup
            </SelectItem>
            <SelectItem value="Nice-to-have — ce serait sympa">
              Ce serait sympa
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Envoyer la demande
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Form view ────────────────────────────────────────────────────────────────

function FormView({ onBack }: { onBack: () => void }) {
  const [formType, setFormType] = useState<FormType | null>(null);
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="flex justify-center">
          <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">
            Merci pour votre retour !
          </h3>
          <p className="text-sm text-muted-foreground">
            Votre signalement a bien été envoyé. Vous serez notifié dès qu'il
            sera traité.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded"
            onClick={() => {
              setSuccess(false);
              setFormType(null);
            }}
          >
            Faire un autre signalement
          </Button>
          <Button size="sm" className="rounded" onClick={onBack}>
            Voir tous les signalements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Retour aux signalements
      </button>

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setFormType("bug")}
          className={`rounded border-2 p-4 text-left transition-all ${
            formType === "bug"
              ? "border-orange-400 bg-orange-50"
              : "border-border hover:border-orange-300 hover:bg-orange-50/40"
          }`}
        >
          <Bug
            className={`size-5 mb-2 ${formType === "bug" ? "text-orange-500" : "text-muted-foreground"}`}
          />
          <p className="font-semibold text-sm text-foreground">
            Signaler un bug
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quelque chose ne fonctionne pas
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFormType("improvement")}
          className={`rounded border-2 p-4 text-left transition-all ${
            formType === "improvement"
              ? "border-primary bg-accent/40"
              : "border-border hover:border-primary/50 hover:bg-accent/20"
          }`}
        >
          <Sparkles
            className={`size-5 mb-2 ${formType === "improvement" ? "text-primary" : "text-muted-foreground"}`}
          />
          <p className="font-semibold text-sm text-foreground">
            Demander une amélioration
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Une idée pour rendre l'outil meilleur
          </p>
        </button>
      </div>

      {formType === "bug" && (
        <BugForm onSuccess={() => setSuccess(true)} />
      )}
      {formType === "improvement" && (
        <ImprovementForm onSuccess={() => setSuccess(true)} />
      )}
    </div>
  );
}

// ─── Shared field wrapper ─────────────────────────────────────────────────────

const inputCls =
  "w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all";
const textareaCls =
  "w-full rounded border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FeedbackPage({
  user,
  onLogin,
  isCollaborator = false,
}: {
  user: GitHubUser | null;
  onLogin: () => void;
  isCollaborator?: boolean;
}) {
  const [view, setView] = useState<View>("list");

  return (
    <div className="min-h-full pb-16">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">
            Signalements
          </h1>
          <p className="text-sm text-muted-foreground">
            Les bugs et améliorations signalés par la communauté.
          </p>
        </div>

        {view === "list" ? (
          <IssuesList
            user={user}
            onLogin={onLogin}
            isCollaborator={isCollaborator}
            onSignal={() => {
              if (!user) {
                onLogin();
              } else {
                setView("form");
              }
            }}
          />
        ) : (
          <FormView onBack={() => setView("list")} />
        )}
      </div>
    </div>
  );
}
