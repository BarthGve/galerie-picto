import { useEffect, useState } from "react";
import { Heart, FolderOpen, ThumbsUp, Mail, Calendar, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

interface UserProfile {
  githubLogin: string;
  githubName: string | null;
  githubAvatarUrl: string | null;
  githubEmail: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  stats: {
    favoritesCount: number;
    collectionsCount: number;
    likesCount: number;
  };
}

interface ProfilePageProps {
  onDeleted: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function ProfilePage({ onDeleted }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const canDelete = profile && confirmInput === profile.githubLogin;

  return (
    <div className="flex-1 overflow-y-auto pb-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-2xl font-bold text-primary mb-8">Mon profil</h1>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-8">

            {/* Identité */}
            <section className="border border-border rounded-[4px] p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">
                Données personnelles détenues
              </h2>
              <div className="flex items-start gap-5">
                <Avatar className="h-16 w-16 shrink-0 rounded-full border border-border">
                  <AvatarImage src={profile.githubAvatarUrl ?? undefined} alt={profile.githubLogin} />
                  <AvatarFallback className="text-lg">
                    {(profile.githubName ?? profile.githubLogin).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                    <span className="text-muted-foreground">Login GitHub</span>
                    <span className="font-mono font-medium">@{profile.githubLogin}</span>

                    <span className="text-muted-foreground">Nom affiché</span>
                    <span>{profile.githubName ?? <span className="text-muted-foreground/50 italic">non renseigné</span>}</span>

                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3" /> Email
                    </span>
                    <span>{profile.githubEmail ?? <span className="text-muted-foreground/50 italic">non communiqué</span>}</span>

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
            <section className="border border-border rounded-[4px] p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">
                Données d'utilisation
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-[4px]">
                  <Heart className="size-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{profile.stats.favoritesCount}</span>
                  <span className="text-xs text-muted-foreground">Favoris</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-[4px]">
                  <FolderOpen className="size-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{profile.stats.collectionsCount}</span>
                  <span className="text-xs text-muted-foreground">Collections</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-[4px]">
                  <ThumbsUp className="size-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{profile.stats.likesCount}</span>
                  <span className="text-xs text-muted-foreground">Likes</span>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section className="border border-destructive/40 rounded-[4px] p-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="size-4 text-destructive" />
                <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
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
