import { useEffect, useState } from "react";
import { Heart, FolderOpen, ThumbsUp, Mail, Calendar, AlertTriangle, User, BarChart2, Inbox, Pencil, Trash2, Check, X, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

interface UserProfile {
  githubLogin: string;
  githubName: string | null;
  githubAvatarUrl: string | null;
  githubEmail: string | null;
  emailNotifications: {
    notifyEmailGdpr: boolean;
    notifyEmailPictoNew: boolean;
    notifyEmailPictoEnCours: boolean;
    notifyEmailPictoPrecision: boolean;
    notifyEmailPictoLivre: boolean;
    notifyEmailPictoRefuse: boolean;
    notifyEmailNewsletter: boolean;
    notifyEmailNewUser: boolean;
  };
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  stats: {
    favoritesCount: number;
    collectionsCount: number;
    likesCount: number;
    requestsCount: number;
  };
}

interface ProfilePageProps {
  onDeleted: () => void;
  isCollaborator?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function ProfilePage({ onDeleted, isCollaborator = false }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("github_token");
    fetch(`${API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!profile || confirmInput !== profile.githubLogin) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("github_token");
      const res = await fetch(`${API_URL}/api/user/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error("Erreur lors de la suppression du compte");
        return;
      }
      onDeleted();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    try {
      const token = localStorage.getItem("github_token");
      const res = await fetch(`${API_URL}/api/user/me/email`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur");
        return;
      }
      setProfile((p) => p ? { ...p, githubEmail: emailInput.trim() } : p);
      setEditingEmail(false);
      toast.success("Email mis à jour");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleDeleteEmail() {
    try {
      const token = localStorage.getItem("github_token");
      const res = await fetch(`${API_URL}/api/user/me/email`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProfile((p) => p ? { ...p, githubEmail: null } : p);
        toast.success("Email supprimé");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  }

  async function handleToggleNotification(key: keyof UserProfile["emailNotifications"], value: boolean) {
    try {
      const token = localStorage.getItem("github_token");
      const res = await fetch(`${API_URL}/api/user/me/notifications`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de la mise à jour");
        return;
      }
      setProfile((p) => p ? {
        ...p,
        emailNotifications: { ...p.emailNotifications, [key]: value },
      } : p);
      toast.success(value ? "Notification activée" : "Notification désactivée");
    } catch {
      toast.error("Erreur réseau");
    }
  }

  const canDelete = profile && confirmInput === profile.githubLogin;

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary mb-8">Mon profil</h1>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-8">

            {/* Identité + Stats — 1/2 1/2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

            {/* Identité */}
            <section className="bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-9 h-9 rounded-lg bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                  <User className="size-4.5" />
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-foreground">
                  Données personnelles détenues
                </h2>
              </div>
              <div className="flex items-start gap-5">
                <Avatar className="h-16 w-16 shrink-0 rounded-full border border-border">
                  <AvatarImage src={profile.githubAvatarUrl ?? undefined} alt={profile.githubLogin} />
                  <AvatarFallback className="text-lg">
                    {(profile.githubName ?? profile.githubLogin).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <span className="text-muted-foreground">Login GitHub</span>
                    <span className="font-mono font-medium">@{profile.githubLogin}</span>

                    <span className="text-muted-foreground">Nom affiché</span>
                    <span>{profile.githubName ?? <span className="text-muted-foreground/50 italic">non renseigné</span>}</span>

                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3" /> Email
                    </span>
                    <span className="flex items-center gap-1.5">
                      {editingEmail ? (
                        <>
                          <Input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="h-7 text-sm max-w-[200px]"
                            placeholder="votre@email.com"
                            autoFocus
                          />
                          <button onClick={handleSaveEmail} disabled={savingEmail || !emailInput.trim()} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                            <Check className="size-3.5" />
                          </button>
                          <button onClick={() => setEditingEmail(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {profile.githubEmail ?? <span className="text-muted-foreground/50 italic">non communiqué</span>}
                          <button onClick={() => { setEmailInput(profile.githubEmail ?? ""); setEditingEmail(true); }} className="text-muted-foreground/50 hover:text-muted-foreground" title="Modifier">
                            <Pencil className="size-3" />
                          </button>
                          {profile.githubEmail && (
                            <button onClick={handleDeleteEmail} className="text-muted-foreground/50 hover:text-destructive" title="Supprimer mon email">
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </>
                      )}
                    </span>

                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3" /> Première connexion
                    </span>
                    <span>{formatDate(profile.firstSeenAt)}</span>

                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3" /> Dernière activité
                    </span>
                    <span>{formatDate(profile.lastSeenAt)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-9 h-9 rounded-lg bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                  <BarChart2 className="size-4.5" />
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-foreground">
                  Données d'utilisation
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-xl">
                  <Heart className="size-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{profile.stats.favoritesCount}</span>
                  <span className="text-xs text-muted-foreground">Favoris</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-xl">
                  <FolderOpen className="size-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{profile.stats.collectionsCount}</span>
                  <span className="text-xs text-muted-foreground">Collections</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-xl">
                  <ThumbsUp className="size-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{profile.stats.likesCount}</span>
                  <span className="text-xs text-muted-foreground">Likes</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-xl">
                  <Inbox className="size-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{profile.stats.requestsCount}</span>
                  <span className="text-xs text-muted-foreground">Demandes de pictos</span>
                </div>
              </div>
            </section>

            </div>{/* Fin grid 1/2 1/2 */}

            {/* Notifications */}
            <section className="bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-9 h-9 rounded-lg bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                  <Bell className="size-4.5" />
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-foreground">
                  Notifications email
                </h2>
              </div>

              <div className="space-y-6">
                {/* Groupe RGPD */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Demandes RGPD
                  </h3>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="notif-gdpr" className="text-sm font-medium">
                        Recevoir les notifications RGPD
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Suivi du traitement de vos demandes d'exercice de droits.
                      </p>
                    </div>
                    <Switch
                      id="notif-gdpr"
                      checked={profile.emailNotifications.notifyEmailGdpr}
                      onCheckedChange={(v) => handleToggleNotification("notifyEmailGdpr", v)}
                    />
                  </div>
                </div>

                <div className="border-t border-border/40" />

                {/* Groupe Demandes de pictogrammes */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Demandes de pictogrammes
                  </h3>
                  <div className="space-y-1">
                    {([
                      ...(isCollaborator ? [{ key: "notifyEmailPictoNew" as const, label: "Nouvelle demande soumise", desc: "Notifie les collaborateurs lorsqu'un utilisateur soumet une demande." }] : []),
                      { key: "notifyEmailPictoEnCours" as const, label: "Demande prise en charge", desc: "Quand votre demande passe au statut « en cours »." },
                      { key: "notifyEmailPictoPrecision" as const, label: "Précisions requises", desc: "Quand des précisions sont demandées sur votre demande." },
                      { key: "notifyEmailPictoLivre" as const, label: "Pictogramme livré", desc: "Quand votre pictogramme est prêt." },
                      { key: "notifyEmailPictoRefuse" as const, label: "Demande refusée", desc: "Quand votre demande a été déclinée." },
                    ]).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                          <Label htmlFor={`notif-${key}`} className="text-sm font-medium">
                            {label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          id={`notif-${key}`}
                          checked={profile.emailNotifications[key]}
                          onCheckedChange={(v) => handleToggleNotification(key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nouveaux utilisateurs (collaborateurs uniquement) */}
                {isCollaborator && (
                  <div className="pt-4 border-t border-border/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Activité utilisateurs
                    </h3>
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="notif-notifyEmailNewUser" className="text-sm font-medium">
                          Nouvel utilisateur inscrit
                        </Label>
                        <p className="text-xs text-muted-foreground">Notification quand un nouvel utilisateur se connecte pour la première fois.</p>
                      </div>
                      <Switch
                        id="notif-notifyEmailNewUser"
                        checked={profile.emailNotifications.notifyEmailNewUser}
                        onCheckedChange={(v) => handleToggleNotification("notifyEmailNewUser", v)}
                      />
                    </div>
                  </div>
                )}

                {/* Newsletter */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-bold text-foreground mb-1">Newsletter hebdomadaire</h3>
                  <p className="text-xs text-muted-foreground mb-3">Récapitulatif des nouveaux pictogrammes chaque samedi.</p>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="notif-notifyEmailNewsletter" className="text-sm font-medium">
                        Recevoir la newsletter
                      </Label>
                      <p className="text-xs text-muted-foreground">Un email par semaine avec les nouveaux pictos.</p>
                    </div>
                    <Switch
                      id="notif-notifyEmailNewsletter"
                      checked={profile.emailNotifications.notifyEmailNewsletter}
                      onCheckedChange={(v) => handleToggleNotification("notifyEmailNewsletter", v)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section className="bg-card rounded-xl p-6 md:p-8 border border-destructive/30 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-9 h-9 rounded-lg bg-destructive text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-4.5" />
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-destructive">
                  Zone de danger
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                La suppression de votre compte est <strong className="text-foreground">irréversible</strong>.
                Vos favoris, collections et likes seront définitivement supprimés.
                Vos pictogrammes publics resteront disponibles dans la galerie.
              </p>
              <div className="space-y-3">
                <Label htmlFor="confirm-login" className="text-sm">
                  Pour confirmer, saisissez votre login GitHub :{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    {profile.githubLogin}
                  </code>
                </Label>
                <Input
                  id="confirm-login"
                  placeholder={profile.githubLogin}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="font-mono max-w-xs"
                  autoComplete="off"
                />
                <Button
                  variant="destructive"
                  disabled={!canDelete || deleting}
                  onClick={handleDelete}
                  className="mt-1"
                >
                  {deleting ? "Suppression…" : "Supprimer définitivement mon compte"}
                </Button>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
