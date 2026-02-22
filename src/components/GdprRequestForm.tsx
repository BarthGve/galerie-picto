import { useState } from "react";
import { BreadcrumbNav } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";

const RIGHT_TYPES = [
  { value: "acces", label: "Droit d'accès", description: "Obtenir une copie de vos données personnelles" },
  { value: "rectification", label: "Droit de rectification", description: "Corriger des données inexactes ou incomplètes" },
  { value: "effacement", label: "Droit à l'effacement", description: "Supprimer vos données personnelles" },
  { value: "portabilite", label: "Droit à la portabilité", description: "Recevoir vos données dans un format structuré" },
  { value: "opposition", label: "Droit d'opposition", description: "Vous opposer au traitement de vos données" },
] as const;

interface GdprRequestFormProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  onLogin: () => void;
}

export function GdprRequestForm({
  isAuthenticated,
  userEmail,
  onLogin,
}: GdprRequestFormProps) {
  const [rightType, setRightType] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!rightType) {
      setError("Veuillez sélectionner un type de droit.");
      return;
    }
    if (!message.trim()) {
      setError("Veuillez décrire votre demande.");
      return;
    }
    if (message.length > 2000) {
      setError("Le message ne doit pas dépasser 2000 caractères.");
      return;
    }
    if (!consent) {
      setError("Vous devez accepter d'être recontacté(e) pour soumettre votre demande.");
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/gdpr-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rightType,
          message: message.trim(),
          consentContact: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Erreur ${res.status}`);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  const charRatio = message.length / 2000;
  const charColor =
    charRatio > 0.9
      ? "text-destructive"
      : charRatio > 0.7
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-12">
      <BreadcrumbNav
        items={[
          { label: "Accueil", href: "/discover" },
          { label: "Confidentialité", href: "/confidentialite" },
          { label: "Exercer mes droits" },
        ]}
      />

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">
            Exercer mes droits
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 dark:bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            <Shield className="size-3.5" />
            Protection des données
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg">
          Conformément au RGPD, vous pouvez exercer vos droits d'accès, de rectification,
          d'effacement, de portabilité et d'opposition.
        </p>
      </div>

      {!isAuthenticated ? (
        /* ── État non connecté ── */
        <div className="max-w-lg">
          <div className="relative overflow-hidden rounded-lg border border-border bg-card ring-1 ring-foreground/5 p-8">
            {/* Barre tricolore en haut */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6a6af4] via-[#7a6b9a] to-[#c83f49]" />
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="flex items-center justify-center size-14 rounded-2xl bg-muted">
                <Shield className="size-7 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">
                  Connexion requise
                </p>
                <p className="text-sm text-muted-foreground">
                  Vous devez être connecté pour exercer vos droits.
                </p>
              </div>
              <Button onClick={onLogin} className="rounded-lg mt-2">
                Se connecter avec GitHub
              </Button>
            </div>
          </div>
        </div>
      ) : submitted ? (
        /* ── État succès ── */
        <div className="flex items-center justify-center flex-1 min-h-[50vh]">
          <div className="max-w-lg w-full rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/10 p-8">
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="flex items-center justify-center size-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Demande enregistrée
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Votre demande a bien été prise en compte. Nous nous engageons à vous
                  répondre dans un délai d'un mois.
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-lg mt-2"
                onClick={() => {
                  setSubmitted(false);
                  setRightType("");
                  setMessage("");
                  setConsent(false);
                }}
              >
                Soumettre une autre demande
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Formulaire ── */
        <div className="max-w-xl mx-auto">
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1 — Identité */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Adresse e-mail
                </label>
                {userEmail ? (
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className="w-full rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                  />
                ) : (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/20 px-3.5 py-2.5">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Aucune adresse e-mail n'est associée à votre compte GitHub. Veuillez en
                      renseigner une dans vos paramètres GitHub avant de soumettre une demande.
                    </p>
                  </div>
                )}
              </div>

              {/* Séparateur léger */}
              <div className="border-t border-border/60" />

              {/* Section 2 — Type de droit */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Type de droit
                </label>
                <div className="grid gap-2">
                  {RIGHT_TYPES.map(({ value, label, description }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRightType(value)}
                      className={`group flex items-center gap-3 w-full text-left rounded-lg border px-4 py-3 transition-all ${
                        rightType === value
                          ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center size-5 rounded-full border-2 shrink-0 transition-colors ${
                          rightType === value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {rightType === value && (
                          <div className="size-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            rightType === value ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      </div>
                      <ChevronRight
                        className={`size-4 shrink-0 transition-colors ${
                          rightType === value
                            ? "text-primary"
                            : "text-muted-foreground/30 group-hover:text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Séparateur léger */}
              <div className="border-t border-border/60" />

              {/* Section 3 — Message */}
              <div className="space-y-1.5">
                <label
                  htmlFor="gdpr-message"
                  className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
                >
                  Votre demande
                </label>
                <textarea
                  id="gdpr-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre demande en détail…"
                  maxLength={2000}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-y transition-shadow"
                />
                <div className="flex items-center justify-end">
                  <p className={`text-[11px] font-medium tabular-nums ${charColor}`}>
                    {message.length.toLocaleString("fr-FR")} / 2 000
                  </p>
                </div>
              </div>

              {/* Section 4 — Consentement */}
              <label className="flex items-start gap-3 cursor-pointer group rounded-lg p-4 hover:bg-muted/20 transition-colors">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary/30 accent-[var(--primary)]"
                  />
                </div>
                <span className="text-sm text-foreground leading-relaxed">
                  J'accepte d'être recontacté(e) sur l'adresse e-mail associée à mon
                  compte
                  {userEmail && (
                    <span className="text-muted-foreground"> ({userEmail})</span>
                  )}
                  {" "}pour le traitement de cette demande.
                </span>
              </label>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 px-4 py-3">
                  <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !rightType || !message.trim() || !consent}
                  className="rounded-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Shield className="size-4" />
                      Envoyer ma demande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Note légale sous le formulaire */}
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Conformément à l'article 12 du RGPD, nous nous engageons à répondre à votre
            demande dans un délai d'un mois. Ce délai peut être prolongé de deux mois
            supplémentaires en cas de complexité.
          </p>
        </div>
      )}
    </div>
  );
}
