import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Download,
  Star,
  MapPin,
  ExternalLink,
  Users,
  FolderOpen,
  Tag,
  ChevronRight,
  TrendingUp,
  ThumbsUp,
} from "lucide-react";
import { useDownloads } from "@/hooks/useDownloads";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DarkAwarePicto } from "@/components/DarkAwarePicto";
import { PictoCard } from "@/components/PictoCard";
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
  getLikeCount?: (id: string) => number;
  hasLiked?: (id: string) => boolean;
  onToggleLike?: (id: string) => void;
}

function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
          <Icon className="size-4.5" />
        </div>
        <h2 className="text-lg md:text-xl font-extrabold text-foreground">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function BentoCard({
  children,
  className = "",
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`group relative bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// Visual positions [left=2nd, center=1st, right=3rd]
const PODIUM_CONFIG = [
  {
    rank: 2,
    stepHeight: "h-9",
    stepClass: "bg-tertiary/60",
    ringClass: "ring-tertiary/40",
    pictoSize: "w-12 h-12",
    rankSize: "text-sm",
  },
  {
    rank: 1,
    stepHeight: "h-14",
    stepClass: "bg-tertiary",
    ringClass: "ring-tertiary",
    pictoSize: "w-[3.75rem] h-[3.75rem]",
    rankSize: "text-lg",
  },
  {
    rank: 3,
    stepHeight: "h-5",
    stepClass: "bg-tertiary/30",
    ringClass: "ring-tertiary/25",
    pictoSize: "w-11 h-11",
    rankSize: "text-xs",
  },
];

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
  getLikeCount,
  hasLiked,
  onToggleLike,
}: DiscoverPageProps) {
  const [topContributorProfile, setTopContributorProfile] =
    useState<GitHubProfile | null>(null);
  const [selectedPicto, setSelectedPicto] = useState<Pictogram | null>(null);
  const { getCount } = useDownloads();

  // Sync selectedPicto quand pictograms se met à jour (ex : après un refetch)
  useEffect(() => {
    if (!selectedPicto) return;
    const updated = pictograms.find((p) => p.id === selectedPicto.id);
    if (updated) setSelectedPicto(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedPicto in deps would cause infinite loop
  }, [pictograms]);

  const latestPictos = useMemo(() => {
    return [...pictograms]
      .sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime(),
      )
      .slice(0, 8);
  }, [pictograms]);

  const mostDownloaded = useMemo(() => {
    return [...pictograms]
      .filter((p) => getCount(p.id) > 0)
      .sort((a, b) => getCount(b.id) - getCount(a.id))
      .slice(0, 3);
  }, [pictograms, getCount]);

  // Podium: top 3 liked, reordered visually as [2nd, 1st, 3rd]
  const podium = useMemo((): { items: (Pictogram | undefined)[]; show: boolean } => {
    if (!getLikeCount) return { items: [], show: false };
    const sorted = [...pictograms]
      .filter((p) => getLikeCount(p.id) > 0)
      .sort((a, b) => getLikeCount(b.id) - getLikeCount(a.id))
      .slice(0, 3);
    if (sorted.length === 0) return { items: [], show: false };
    // Visual order: left=2nd, center=1st, right=3rd
    return {
      show: true,
      items: [sorted[1], sorted[0], sorted[2]],
    };
  }, [pictograms, getLikeCount]);

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
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">
            Découvrir
          </h1>
          <p className="mt-2 text-lg text-muted-foreground font-medium">
            Les derniers ajouts, les collections populaires et les contributeurs
            de la galerie.
          </p>
        </div>

        {/* ══════════════════════════════════════════
            DEUX COLONNES
           ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

          {/* ── Colonne gauche : Derniers ajouts + Galeries ── */}
          <div className="flex flex-col gap-6">

          {/* ── Derniers ajouts ── */}
          {latestPictos.length > 0 && (
            <BentoCard className="hover:!shadow-sm hover:!translate-y-0">
              <SectionHeader
                title="Derniers ajouts"
                icon={Clock}
                action={
                  <button
                    onClick={() => onNavigateGallery()}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Tout voir <ChevronRight className="w-4 h-4" />
                  </button>
                }
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {latestPictos.map((picto) => (
                  <PictoCard
                    key={picto.id}
                    pictogram={picto}
                    galleries={galleries}
                    onAddToGallery={onAddToGallery}
                    onRemoveFromGallery={onRemoveFromGallery}
                    isAuthenticated={isAuthenticated}
                    user={user}
                    onPictogramUpdated={onPictogramUpdated}
                    isFavorite={isFavorite?.(picto.id)}
                    onToggleFavorite={onToggleFavorite}
                    onLogin={onLogin}
                    likeCount={getLikeCount?.(picto.id) ?? 0}
                    hasLiked={hasLiked?.(picto.id)}
                    onToggleLike={onToggleLike}
                    actionsPosition="bottom"
                  />
                ))}
              </div>
            </BentoCard>
          )}

          {/* ── Galeries à la une ── */}
          {featuredGalleries.length > 0 && (
            <BentoCard className="hover:!shadow-sm hover:!translate-y-0">
              <SectionHeader
                title="Galeries à la une"
                icon={FolderOpen}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredGalleries.map((gallery) => {
                  const previews = galleryPreviewPictos(gallery);
                  return (
                    <div
                      key={gallery.id}
                      className="relative rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all group/gallery"
                      onClick={() =>
                        onNavigateGallery({ galleryId: gallery.id })
                      }
                    >
                      {/* Grille 2x2 de pictos */}
                      <div className="grid grid-cols-2 gap-px bg-border/30 aspect-[4/3]">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="bg-card flex items-center justify-center p-3 group-hover/gallery:bg-accent/20 transition-colors"
                          >
                            {previews[i] ? (
                              <DarkAwarePicto
                                pictogram={previews[i]}
                                width={48}
                                height={48}
                                className="w-full h-full object-contain opacity-80 group-hover/gallery:opacity-100 transition-opacity"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-border/20" />
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Overlay bas avec infos */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/95 to-transparent pt-8 pb-4 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          {gallery.color && (
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-card"
                              style={{ backgroundColor: gallery.color }}
                            />
                          )}
                          <h3 className="text-sm font-extrabold tracking-tight text-foreground truncate">
                            {gallery.name}
                          </h3>
                        </div>
                        {gallery.description && (
                          <p className="text-xs text-muted-foreground font-medium line-clamp-1 leading-relaxed mb-2">
                            {gallery.description}
                          </p>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-[10px] font-bold">
                          {gallery.pictogramIds.length} picto{gallery.pictogramIds.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}

          </div>

          {/* ── Colonne droite : Top téléchargés + Podium + Tags ── */}
          <div className="flex flex-col gap-6">
          {mostDownloaded.length > 0 && (
            <BentoCard className="bg-accent hover:!shadow-sm hover:!translate-y-0">
              <SectionHeader title="Top téléchargés" icon={TrendingUp} />
              {(() => {
                const maxCount = mostDownloaded.length > 0 ? getCount(mostDownloaded[0].id) : 1;
                const cardStyles = [
                  "bg-[var(--accent)] dark:bg-[var(--accent)]",
                  "bg-[var(--accent)]/50 dark:bg-[var(--accent)]/50",
                  "bg-[var(--accent)]/20 dark:bg-[var(--accent)]/20",
                ];
                const rankColors = [
                  "bg-tertiary text-tertiary-foreground",
                  "bg-tertiary/60 text-tertiary-foreground",
                  "bg-tertiary/30 text-tertiary-foreground dark:text-foreground",
                ];
                return (
                  <div className="space-y-2.5">
                    {mostDownloaded.map((picto, idx) => {
                      const ratio = Math.round((getCount(picto.id) / maxCount) * 100);
                      return (
                        <div
                          key={picto.id}
                          className={`relative rounded-lg p-3.5 transition-all cursor-pointer hover:shadow-lg ${cardStyles[idx] ?? cardStyles[2]}`}
                          onClick={() => setSelectedPicto(picto)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank badge */}
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${rankColors[idx] ?? rankColors[2]}`}>
                              {idx + 1}
                            </span>
                            {/* Picto thumbnail */}
                            <div className="w-10 h-10 rounded-lg border border-border/50 bg-card/80 flex items-center justify-center p-1 shrink-0">
                              <DarkAwarePicto
                                pictogram={picto}
                                width={32}
                                height={32}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {/* Name + count */}
                            <div className="flex-1 min-w-0">
                              <p className="font-extrabold text-sm truncate text-foreground">
                                {picto.name}
                              </p>
                              <span className="inline-flex items-center gap-1 text-badge-download-text text-[10px] font-bold">
                                <Download className="size-2.5" />
                                {getCount(picto.id)}
                              </span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2.5 h-1.5 rounded-full bg-foreground/[0.06] dark:bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-tertiary/70 transition-all duration-500"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <button
                onClick={() => onNavigateGallery()}
                className="w-full mt-4 px-6 py-2.5 rounded-xl bg-primary hover:bg-(--primary-hover) active:bg-(--primary-active) text-primary-foreground font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Voir tout <TrendingUp className="w-4 h-4" />
                </span>
              </button>
            </BentoCard>
          )}

          {/* ── Podium des likes ── */}
          {podium.show && (
            <BentoCard className="hover:!shadow-sm hover:!translate-y-0">
              <SectionHeader title="Podium des likes" icon={ThumbsUp} />

              <div className="flex items-end justify-center gap-3 pt-1">
                {podium.items.map((picto, visualIdx) => {
                  const cfg = PODIUM_CONFIG[visualIdx];
                  return (
                    <div key={visualIdx} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      {picto ? (
                        <>
                          {/* Pictogramme dans cercle avec ring */}
                          <div
                            className={`${cfg.pictoSize} rounded-full ring-2 ${cfg.ringClass} bg-card flex items-center justify-center p-2 cursor-pointer hover:scale-110 transition-transform`}
                            onClick={() => setSelectedPicto(picto)}
                          >
                            <DarkAwarePicto
                              pictogram={picto}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Nom */}
                          <p className="text-[10px] font-extrabold truncate w-full text-center text-foreground leading-tight px-0.5">
                            {picto.name}
                          </p>
                          {/* Nb likes */}
                          <span className="flex items-center gap-0.5 text-xs font-black text-tertiary">
                            <ThumbsUp className="size-2.5" />
                            {getLikeCount?.(picto.id) ?? 0}
                          </span>
                        </>
                      ) : (
                        /* Slot vide — équilibre visuel */
                        <div className={`${cfg.pictoSize} opacity-0`} />
                      )}

                      {/* Marche du podium */}
                      <div
                        className={`w-full ${cfg.stepHeight} ${cfg.stepClass} rounded-t-lg flex items-center justify-center mt-1`}
                      >
                        <span className={`font-black ${cfg.rankSize} text-tertiary-foreground`}>
                          {cfg.rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}

          {/* ── Tags populaires ── */}
          {topTags.length > 0 && (
            <BentoCard className="hover:!shadow-sm hover:!translate-y-0 bg-[var(--dsfr-blue-france-975)] dark:bg-[var(--dsfr-blue-france-main)]/[0.08]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-9 h-9 rounded-lg bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                  <Tag className="size-4.5" />
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-foreground">
                  Tags populaires
                </h2>
              </div>
              {(() => {
                const tags = topTags.slice(0, 20);
                const maxCount = tags[0]?.count ?? 1;
                const minCount = tags[tags.length - 1]?.count ?? 1;
                const range = maxCount - minCount || 1;
                // 5 tailles : text-[10px] → text-xs → text-sm → text-base → text-lg
                const sizeClasses = ["text-[10px] px-2 py-1", "text-xs px-2.5 py-1", "text-sm px-3 py-1.5", "text-sm px-3 py-1.5 font-extrabold", "text-base px-3.5 py-1.5 font-extrabold"];
                const opacityClasses = ["opacity-50", "opacity-60", "opacity-75", "opacity-90", "opacity-100"];
                return (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {tags.map(({ name, count }) => {
                      const level = Math.round(((count - minCount) / range) * 4);
                      return (
                        <button
                          key={name}
                          onClick={() => onNavigateGallery({ search: name })}
                          className={`${sizeClasses[level]} ${opacityClasses[level]} rounded-xl bg-background/60 border border-border font-bold text-foreground transition-all cursor-pointer hover:bg-[var(--dsfr-blue-france-850)] hover:border-[var(--dsfr-blue-france-850)] hover:opacity-100`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </BentoCard>
          )}
          </div>
        </div>

          {/* ── Contributeur à la une (full width) ── */}
          {topContributor && (
            <BentoCard className="mt-6 bg-accent p-4 md:p-5">
              <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                <svg className="w-32 h-32 rotate-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-5">
                <div className="relative shrink-0">
                  <div className="absolute -inset-3 bg-gradient-to-tr from-[#e3e3fd] to-[#2845c1] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <Avatar className="relative h-14 w-14 md:h-16 md:w-16 ring-2 ring-ring-accent ring-offset-2 ring-offset-background shadow-xl">
                    <AvatarImage
                      src={
                        topContributorProfile?.avatar_url ||
                        `https://github.com/${topContributor.username}.png?size=96`
                      }
                      alt={topContributor.username}
                    />
                    <AvatarFallback className="text-base font-bold">
                      {topContributor.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-[#2845c1] to-[#6a6af4] border-2 border-background flex items-center justify-center text-primary-foreground shadow-lg">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left space-y-2">
                  <div>
                    <h3 className="text-base md:text-lg font-extrabold tracking-tight text-tertiary">
                      {topContributorProfile?.name || topContributor.username}
                    </h3>
                    <p className="text-github-accent font-bold">
                      @{topContributor.username}
                    </p>
                  </div>
                  {topContributorProfile?.bio && (
                    <p className="text-muted-foreground font-medium leading-relaxed max-w-xl">
                      {topContributorProfile.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                    {topContributorProfile?.location && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <MapPin className="size-3.5 text-chart-1" />
                        {topContributorProfile.location}
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-badge-accent-bg border border-badge-accent-border text-badge-accent-text text-xs font-bold">
                      {topContributor.count} picto{topContributor.count > 1 ? "s" : ""}
                    </span>
                    {topContributorProfile?.followers !== undefined && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Users className="size-3.5 text-github-accent" />
                        {topContributorProfile.followers} follower{topContributorProfile.followers > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {topContributorProfile?.html_url && (
                  <a
                    href={topContributorProfile.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta shrink-0 px-6 py-3 rounded bg-foreground text-background font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center gap-2">
                      Profil GitHub
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </a>
                )}
              </div>
            </BentoCard>
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
