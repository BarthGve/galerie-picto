import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Download,
  Star,
  MapPin,
  ExternalLink,
  Users,
  FolderOpen,
} from "lucide-react";
import { useDownloads } from "@/hooks/useDownloads";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DarkAwarePicto } from "@/components/DarkAwarePicto";
import { API_URL } from "@/lib/config";
import type { Pictogram, Gallery } from "@/lib/types";

const PictoModal = lazy(() =>
  import("./PictoModal").then((m) => ({ default: m.PictoModal })),
);

interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
}

interface DiscoverPageProps {
  pictograms: Pictogram[];
  galleries: Gallery[];
  onNavigateGallery: (options?: {
    galleryId?: string;
    search?: string;
  }) => void;
  isAuthenticated?: boolean;
  user?: { login: string; avatar_url: string } | null;
  onPictogramUpdated?: () => void;
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

export function DiscoverPage({
  pictograms,
  galleries,
  onNavigateGallery,
  isAuthenticated,
  user,
  onPictogramUpdated,
  onAddToGallery,
  onRemoveFromGallery,
}: DiscoverPageProps) {
  const [topContributorProfile, setTopContributorProfile] =
    useState<GitHubProfile | null>(null);
  const [selectedPicto, setSelectedPicto] = useState<Pictogram | null>(null);
  const { getCount } = useDownloads();

  // 1. Derniers ajouts (5 les plus récents)
  const latestPictos = useMemo(() => {
    return [...pictograms]
      .sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime(),
      )
      .slice(0, 5);
  }, [pictograms]);

  // 1b. Les plus téléchargés (top 5)
  const mostDownloaded = useMemo(() => {
    return [...pictograms]
      .filter((p) => getCount(p.id) > 0)
      .sort((a, b) => getCount(b.id) - getCount(a.id))
      .slice(0, 5);
  }, [pictograms, getCount]);

  // 2. Meilleur contributeur
  const topContributor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of pictograms) {
      if (p.contributor?.githubUsername) {
        counts.set(
          p.contributor.githubUsername,
          (counts.get(p.contributor.githubUsername) || 0) + 1,
        );
      }
    }
    let best = "";
    let max = 0;
    for (const [username, count] of counts) {
      if (count > max) {
        best = username;
        max = count;
      }
    }
    return best ? { username: best, count: max } : null;
  }, [pictograms]);

  // Fetch du profil GitHub du top contributeur
  useEffect(() => {
    if (!topContributor) return;
    let cancelled = false;
    fetch(`${API_URL}/api/github/profile/${topContributor.username}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setTopContributorProfile(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [topContributor]);

  // 3. Collections à la une (top 3 par nombre de pictos)
  const featuredGalleries = useMemo(() => {
    return [...galleries]
      .sort((a, b) => b.pictogramIds.length - a.pictogramIds.length)
      .slice(0, 3);
  }, [galleries]);

  // 4. Nuage de tags
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of pictograms) {
      if (p.tags) {
        for (const tag of p.tags) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [pictograms]);

  // Trouver les pictos d'aperçu pour une galerie
  const galleryPreviewPictos = (gallery: Gallery) => {
    const ids = new Set(gallery.pictogramIds);
    return pictograms.filter((p) => ids.has(p.id)).slice(0, 4);
  };

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-primary">
            Découvrir
          </h1>
          <p className="mt-2 text-muted-foreground">
            Les derniers ajouts, les collections populaires et les contributeurs
            de la galerie.
          </p>
        </div>

        {/* Section 1 : Derniers ajouts */}
        {latestPictos.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Derniers ajouts</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {latestPictos.map((picto) => (
                <Card
                  key={picto.id}
                  className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-card/60 dark:bg-card/30 backdrop-blur-md border-border/50"
                  onClick={() => setSelectedPicto(picto)}
                >
                  <CardContent className="flex flex-col items-center gap-3 p-4">
                    <div className="w-16 h-16 flex items-center justify-center">
                      <DarkAwarePicto
                        pictogram={picto}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                      />
                    </div>
                    <div className="text-center w-full">
                      <p className="text-sm font-medium truncate">
                        {picto.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(picto.lastModified)}
                      </p>
                      {picto.tags && picto.tags.length > 0 && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {picto.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Section 1b : Les plus téléchargés */}
        {mostDownloaded.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Download className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Les plus téléchargés</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {mostDownloaded.map((picto) => (
                <Card
                  key={picto.id}
                  className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-card/60 dark:bg-card/30 backdrop-blur-md border-border/50"
                  onClick={() => setSelectedPicto(picto)}
                >
                  <CardContent className="flex flex-col items-center gap-3 p-4">
                    <div className="w-16 h-16 flex items-center justify-center">
                      <DarkAwarePicto
                        pictogram={picto}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                      />
                    </div>
                    <div className="text-center w-full">
                      <p className="text-sm font-medium truncate">
                        {picto.name}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <Download className="size-3 mr-1" />
                        {getCount(picto.id)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Section 2 : Meilleur contributeur */}
        {topContributor && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">
                Contributeur à la une
              </h2>
            </div>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20">
              <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
                <Avatar className="h-20 w-20 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  <AvatarImage
                    src={
                      topContributorProfile?.avatar_url ||
                      `https://github.com/${topContributor.username}.png?size=80`
                    }
                    alt={topContributor.username}
                  />
                  <AvatarFallback className="text-xl">
                    {topContributor.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold">
                    {topContributorProfile?.name || topContributor.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{topContributor.username}
                  </p>
                  {topContributorProfile?.bio && (
                    <p className="mt-2 text-sm">{topContributorProfile.bio}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    {topContributorProfile?.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {topContributorProfile.location}
                      </span>
                    )}
                    <Badge variant="secondary">
                      {topContributor.count} pictogrammes
                    </Badge>
                    {topContributorProfile?.followers !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        {topContributorProfile.followers} followers
                      </span>
                    )}
                  </div>
                </div>
                {topContributorProfile?.html_url && (
                  <a
                    href={topContributorProfile.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="size-4 mr-1" />
                      Profil GitHub
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Section 3 : Collections a la une */}
        {featuredGalleries.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Collections à la une</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredGalleries.map((gallery) => (
                <Card
                  key={gallery.id}
                  className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  onClick={() =>
                    onNavigateGallery({ galleryId: gallery.id })
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {gallery.color && (
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: gallery.color }}
                        />
                      )}
                      <CardTitle className="text-base truncate">
                        {gallery.name}
                      </CardTitle>
                    </div>
                    {gallery.description && (
                      <CardDescription className="line-clamp-2">
                        {gallery.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-3">
                      {galleryPreviewPictos(gallery).map((picto) => (
                        <div
                          key={picto.id}
                          className="w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center p-1"
                        >
                          <DarkAwarePicto
                            pictogram={picto}
                            width={32}
                            height={32}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {gallery.pictogramIds.length} pictogrammes
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Section 4 : Nuage de tags */}
        {topTags.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
              <h2 className="text-lg font-semibold text-primary">Tags</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {topTags.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => onNavigateGallery({ search: name })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 dark:bg-card/30 backdrop-blur-sm px-3 py-1.5 text-sm transition-colors hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                >
                  {name}
                  <span className="text-xs text-muted-foreground font-medium">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

      </div>

      {selectedPicto && (
        <Suspense fallback={null}>
          <PictoModal
            pictogram={selectedPicto}
            isOpen={!!selectedPicto}
            onClose={() => setSelectedPicto(null)}
            galleries={galleries}
            onAddToGallery={onAddToGallery}
            onRemoveFromGallery={onRemoveFromGallery}
            isAuthenticated={isAuthenticated}
            user={user}
            onPictogramUpdated={onPictogramUpdated}
          />
        </Suspense>
      )}
    </div>
  );
}
