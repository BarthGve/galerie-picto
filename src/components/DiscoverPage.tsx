import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Download,
  Star,
  MapPin,
  ExternalLink,
  Users,
  FolderOpen,
  Heart,
  Tag,
} from "lucide-react";
import { useDownloads } from "@/hooks/useDownloads";
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
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  onLogin?: () => void;
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

function SectionHeader({
  title,
  icon: Icon,
  gradient,
}: {
  title: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-primary-foreground shadow-lg shrink-0`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-gradient-primary">
        {title}
      </h2>
    </div>
  );
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
  isFavorite,
  onToggleFavorite,
  onLogin,
}: DiscoverPageProps) {
  const [topContributorProfile, setTopContributorProfile] =
    useState<GitHubProfile | null>(null);
  const [selectedPicto, setSelectedPicto] = useState<Pictogram | null>(null);
  const { getCount } = useDownloads();

  const latestPictos = useMemo(() => {
    return [...pictograms]
      .sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime(),
      )
      .slice(0, 5);
  }, [pictograms]);

  const mostDownloaded = useMemo(() => {
    return [...pictograms]
      .filter((p) => getCount(p.id) > 0)
      .sort((a, b) => getCount(b.id) - getCount(a.id))
      .slice(0, 5);
  }, [pictograms, getCount]);

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

  const featuredGalleries = useMemo(() => {
    return [...galleries]
      .sort((a, b) => b.pictogramIds.length - a.pictogramIds.length)
      .slice(0, 3);
  }, [galleries]);

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

  const galleryPreviewPictos = (gallery: Gallery) => {
    const ids = new Set(gallery.pictogramIds);
    return pictograms.filter((p) => ids.has(p.id)).slice(0, 4);
  };

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Découvrir
          </h1>
          <p className="mt-2 text-lg text-muted-foreground font-medium">
            Les derniers ajouts, les collections populaires et les contributeurs
            de la galerie.
          </p>
        </div>

        {/* Derniers ajouts */}
        {latestPictos.length > 0 && (
          <section>
            <SectionHeader
              title="Derniers ajouts"
              icon={Clock}
              gradient="from-amber-400 to-orange-500"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {latestPictos.map((picto) => (
                <div
                  key={picto.id}
                  className="group relative bg-card border border-border rounded-3xl p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                  onClick={() => setSelectedPicto(picto)}
                >
                  {isAuthenticated && onToggleFavorite && isFavorite && (
                    <button
                      className="absolute top-3 right-3 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(picto.id);
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${isFavorite(picto.id) ? "fill-red-500 text-red-500" : "text-muted-foreground/40 hover:text-red-400"}`}
                      />
                    </button>
                  )}
                  <div className="aspect-square rounded-2xl flex items-center justify-center p-4 mb-3">
                    <DarkAwarePicto
                      pictogram={picto}
                      className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground truncate">
                      {picto.name}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {timeAgo(picto.lastModified)}
                    </p>
                    {picto.tags && picto.tags.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-badge-bg border border-badge-border text-badge-text text-[10px] font-bold uppercase tracking-wide">
                        {picto.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Les plus téléchargés */}
        {mostDownloaded.length > 0 && (
          <section>
            <SectionHeader
              title="Les plus téléchargés"
              icon={Download}
              gradient="from-rose-500 to-fuchsia-600"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {mostDownloaded.map((picto) => (
                <div
                  key={picto.id}
                  className="group bg-card border border-border rounded-3xl p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                  onClick={() => setSelectedPicto(picto)}
                >
                  <div className="aspect-square rounded-2xl flex items-center justify-center p-4 mb-3">
                    <DarkAwarePicto
                      pictogram={picto}
                      className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground truncate">
                      {picto.name}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-badge-download-bg border border-badge-download-border text-badge-download-text text-[10px] font-bold">
                      <Download className="size-2.5" />
                      {getCount(picto.id)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contributeur à la une */}
        {topContributor && (
          <section>
            <SectionHeader
              title="Contributeur à la une"
              icon={Star}
              gradient="from-fuchsia-500 to-purple-600"
            />
            <div className="relative p-8 md:p-10 rounded-[2rem] bg-accent border border-github-border shadow-xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                <svg className="w-48 h-48 rotate-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                <div className="relative shrink-0">
                  <Avatar className="h-24 w-24 ring-4 ring-ring-accent ring-offset-2 ring-offset-background shadow-xl">
                    <AvatarImage
                      src={
                        topContributorProfile?.avatar_url ||
                        `https://github.com/${topContributor.username}.png?size=96`
                      }
                      alt={topContributor.username}
                    />
                    <AvatarFallback className="text-xl font-bold">
                      {topContributor.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 border-2 border-background flex items-center justify-center text-primary-foreground shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">
                      {topContributorProfile?.name || topContributor.username}
                    </h3>
                    <p className="text-github-accent font-bold">
                      @{topContributor.username}
                    </p>
                  </div>
                  {topContributorProfile?.bio && (
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      {topContributorProfile.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                    {topContributorProfile?.location && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <MapPin className="size-3.5 text-chart-1" />
                        {topContributorProfile.location}
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-badge-accent-bg border border-badge-accent-border text-badge-accent-text text-xs font-bold">
                      {topContributor.count} pictogrammes
                    </span>
                    {topContributorProfile?.followers !== undefined && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Users className="size-3.5 text-github-accent" />
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
                    className="btn-cta shrink-0 px-6 py-3 rounded-2xl bg-foreground text-background font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center gap-2">
                      Profil GitHub
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Collections à la une */}
        {featuredGalleries.length > 0 && (
          <section>
            <SectionHeader
              title="Collections à la une"
              icon={FolderOpen}
              gradient="from-indigo-500 to-purple-600"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredGalleries.map((gallery) => (
                <div
                  key={gallery.id}
                  className="group bg-card border border-border rounded-3xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                  onClick={() =>
                    onNavigateGallery({ galleryId: gallery.id })
                  }
                >
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      {gallery.color && (
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: gallery.color }}
                        />
                      )}
                      <h3 className="text-base font-extrabold text-foreground truncate">
                        {gallery.name}
                      </h3>
                    </div>
                    {gallery.description && (
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                        {gallery.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {galleryPreviewPictos(gallery).map((picto) => (
                      <div
                        key={picto.id}
                        className="w-10 h-10 rounded-xl bg-surface-subtle border border-border flex items-center justify-center p-1 group-hover:bg-accent transition-colors"
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-badge-accent-bg border border-badge-accent-border text-badge-accent-text text-xs font-bold">
                    {gallery.pictogramIds.length} pictogrammes
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {topTags.length > 0 && (
          <section className="pb-4">
            <SectionHeader
              title="Tags populaires"
              icon={Tag}
              gradient="from-cyan-500 to-blue-600"
            />
            <div className="flex flex-wrap gap-3">
              {topTags.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => onNavigateGallery({ search: name })}
                  className="px-4 py-2 rounded-full bg-card border border-border text-muted-foreground font-bold text-sm transition-all hover:border-primary/30 hover:bg-accent hover:text-primary hover:scale-105 active:scale-95 shadow-sm flex items-center gap-2"
                >
                  {name}
                  <span className="text-muted-foreground/60 font-medium text-xs">
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
            onLogin={onLogin}
          />
        </Suspense>
      )}
    </div>
  );
}
