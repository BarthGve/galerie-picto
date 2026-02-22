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
  ChevronRight,
  TrendingUp,
  ThumbsUp,
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
  getLikeCount?: (id: string) => number;
  hasLiked?: (id: string) => boolean;
  onToggleLike?: (id: string) => void;
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
  action,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-tertiary/80 backdrop-blur-sm flex items-center justify-center text-tertiary-foreground shadow-lg ring-1 ring-tertiary/20 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-tertiary">
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
      className={`group relative bg-card rounded p-6 md:p-8 shadow-sm transition-all duration-500 hover:shadow-xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

const glass = (r: number, g: number, b: number): React.CSSProperties => ({
  background: `rgba(${r}, ${g}, ${b}, 0.65)`,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: `1px solid rgba(${r}, ${g}, ${b}, 0.65)`,
});

// Visual positions [left=2nd, center=1st, right=3rd]
const PODIUM_CONFIG = [
  {
    rank: 2,
    stepHeight: "h-8",
    stepStyle: glass(206, 206, 206),          // grey-850
    rankStyle: { color: `var(--dsfr-grey-200)` },
    countStyle: { color: `var(--dsfr-grey-425)` },
    borderStyle: { borderColor: `var(--dsfr-grey-850)` },
    pictoSize: "w-12 h-12",
    shadowClass: "",
    rankSize: "text-sm",
  },
  {
    rank: 1,
    stepHeight: "h-14",
    stepStyle: glass(239, 203, 58),           // yellow-tournesol-850
    rankStyle: { color: `var(--dsfr-yellow-tournesol-sun)` },
    countStyle: { color: `var(--dsfr-yellow-tournesol-main)` },
    borderStyle: {},
    pictoSize: "w-[3.75rem] h-[3.75rem]",
    shadowClass: "shadow-[0_4px_16px_rgba(239,203,58,0.25)]",
    rankSize: "text-lg",
  },
  {
    rank: 3,
    stepHeight: "h-5",
    stepStyle: glass(228, 121, 74),           // orange-terre-battue-main
    rankStyle: { color: `var(--dsfr-orange-terre-battue-sun)` },
    countStyle: { color: `var(--dsfr-orange-terre-battue-sun)` },
    borderStyle: { borderColor: `var(--dsfr-orange-terre-battue-main)` },
    pictoSize: "w-11 h-11",
    shadowClass: "",
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
            BENTO GRID
           ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-min">

          {/* ── Derniers ajouts (4 cols, 2 rows) ── */}
          {latestPictos.length > 0 && (
            <BentoCard className="md:col-span-4 lg:col-span-4 lg:row-span-2 hover:!shadow-sm hover:!translate-y-0">
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
                  <div
                    key={picto.id}
                    className="group/item relative rounded p-4 border border-border hover:bg-accent/30 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedPicto(picto)}
                  >
                    {isAuthenticated && onToggleFavorite && isFavorite && (
                      <button
                        className="absolute top-3 right-3 z-10 p-1.5 rounded transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(picto.id);
                        }}
                      >
                        <Heart
                          className="h-4 w-4 transition-colors"
                          style={isFavorite(picto.id) ? {
                            color: "var(--dsfr-red-marianne-main)",
                            fill: "var(--dsfr-red-marianne-main)",
                          } : { color: "color-mix(in srgb, var(--muted-foreground) 30%, transparent)" }}
                        />
                      </button>
                    )}
                    {isAuthenticated && onToggleLike && (
                      <button
                        className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 p-1.5 rounded transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(picto.id);
                        }}
                      >
                        <ThumbsUp
                          className={`h-3.5 w-3.5 transition-colors ${hasLiked?.(picto.id) ? "fill-[var(--dsfr-blue-france-main)] text-[var(--dsfr-blue-france-main)]" : "text-muted-foreground/30 hover:text-[var(--dsfr-blue-france-main)]"}`}
                        />
                        {(getLikeCount?.(picto.id) ?? 0) > 0 && (
                          <span className={`text-[10px] font-bold leading-none ${hasLiked?.(picto.id) ? "text-[var(--dsfr-blue-france-main)]" : "text-muted-foreground/50"}`}>
                            {getLikeCount!(picto.id)}
                          </span>
                        )}
                      </button>
                    )}

                    <div className="aspect-square flex items-center justify-center p-3 mb-3">
                      <DarkAwarePicto
                        pictogram={picto}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover/item:scale-110"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-foreground truncate group-hover/item:text-primary transition-colors">
                        {picto.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
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
            </BentoCard>
          )}

          {/* ── Top téléchargés (2 cols, 1 row) ── */}
          {mostDownloaded.length > 0 && (
            <BentoCard className="md:col-span-2 lg:col-span-2 bg-accent hover:!shadow-sm hover:!translate-y-0">
              <SectionHeader title="Top téléchargés" icon={TrendingUp} />
              <div className="space-y-3">
                {mostDownloaded.map((picto, idx) => (
                  <div
                    key={picto.id}
                    className="flex items-center gap-3 p-3 rounded bg-card/60 border border-border hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedPicto(picto)}
                  >
                    <div className="w-11 h-11 rounded border border-border flex items-center justify-center p-1 shrink-0">
                      <DarkAwarePicto
                        pictogram={picto}
                        width={36}
                        height={36}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-foreground">
                        {picto.name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-badge-download-text text-[10px] font-bold">
                        <Download className="size-2.5" />
                        {getCount(picto.id)}
                      </span>
                    </div>
                    <span className="font-extrabold text-primary/15 text-xl italic">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigateGallery()}
                className="w-full mt-4 px-6 py-2.5 rounded bg-primary hover:bg-(--primary-hover) active:bg-(--primary-active) text-primary-foreground font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Voir tout <TrendingUp className="w-4 h-4" />
                </span>
              </button>
            </BentoCard>
          )}

          {/* ── Podium des likes (2 cols, 1 row) ── */}
          {podium.show && (
            <BentoCard className="md:col-span-2 lg:col-span-2 hover:!shadow-sm hover:!translate-y-0">
              <SectionHeader title="Podium des likes" icon={ThumbsUp} />

              <div className="flex items-end justify-center gap-2 pt-1">
                {podium.items.map((picto, visualIdx) => {
                  const cfg = PODIUM_CONFIG[visualIdx];
                  return (
                    <div key={visualIdx} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      {picto ? (
                        <>
                          {/* Pictogramme */}
                          <div
                            className={`${cfg.pictoSize} ${cfg.shadowClass} rounded-[4px] border bg-card flex items-center justify-center p-1.5 cursor-pointer hover:scale-110 transition-transform`}
                            style={cfg.borderStyle}
                            onClick={() => setSelectedPicto(picto)}
                          >
                            <DarkAwarePicto
                              pictogram={picto}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Nom */}
                          <p className="text-[10px] font-bold truncate w-full text-center text-foreground leading-tight px-0.5">
                            {picto.name}
                          </p>
                          {/* Nb likes */}
                          <span className="flex items-center gap-0.5 text-[10px] font-bold" style={cfg.countStyle}>
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
                        className={`w-full ${cfg.stepHeight} rounded-t-[4px] flex items-center justify-center mt-1`}
                        style={cfg.stepStyle}
                      >
                        <span className={`font-black ${cfg.rankSize}`} style={cfg.rankStyle}>
                          {cfg.rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}

          {/* ── Collections à la une (4 cols) ── */}
          {featuredGalleries.length > 0 && (
            <BentoCard className="md:col-span-4 lg:col-span-4 hover:!shadow-sm hover:!translate-y-0">
              <SectionHeader
                title="Galeries à la une"
                icon={FolderOpen}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredGalleries.map((gallery) => (
                  <div
                    key={gallery.id}
                    className="flex flex-col p-5 rounded hover:bg-accent/30 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() =>
                      onNavigateGallery({ galleryId: gallery.id })
                    }
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {gallery.color && (
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: gallery.color }}
                        />
                      )}
                      <h3 className="text-base font-extrabold tracking-tight text-tertiary truncate">
                        {gallery.name}
                      </h3>
                    </div>
                    {gallery.description && (
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed mb-3">
                        {gallery.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-3 mt-auto">
                      {galleryPreviewPictos(gallery).map((picto) => (
                        <div
                          key={picto.id}
                          className="w-9 h-9 rounded border border-border flex items-center justify-center p-0.5"
                        >
                          <DarkAwarePicto
                            pictogram={picto}
                            width={28}
                            height={28}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="inline-flex items-center self-start px-3 py-1 rounded-full bg-badge-accent-bg border border-badge-accent-border text-badge-accent-text text-xs font-bold">
                      {gallery.pictogramIds.length} picto{gallery.pictogramIds.length > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          )}

          {/* ── Tags populaires (2 cols) ── */}
          {topTags.length > 0 && (
            <BentoCard className="md:col-span-2 lg:col-span-2 hover:!shadow-sm hover:!translate-y-0 bg-[var(--dsfr-blue-france-975)] dark:bg-[var(--dsfr-blue-france-main)]/[0.08]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded bg-tertiary/80 backdrop-blur-sm flex items-center justify-center text-tertiary-foreground shadow-lg ring-1 ring-tertiary/20">
                  <Tag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-tertiary">
                  Tags populaires
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {topTags.slice(0, 15).map(({ name, count }) => (
                  <button
                    key={name}
                    onClick={() => onNavigateGallery({ search: name })}
                    className="px-3 py-1.5 rounded-xl bg-background/60 border border-border text-xs font-bold text-foreground transition-all cursor-pointer"
                    style={{ '--hover-bg': 'var(--dsfr-blue-france-850)' } as React.CSSProperties}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--dsfr-blue-france-850)'; e.currentTarget.style.borderColor = 'var(--dsfr-blue-france-850)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = ''; }}
                  >
                    {name}{" "}
                    <span className="ml-1 text-[var(--dsfr-blue-france-main)] font-extrabold">{count}</span>
                  </button>
                ))}
              </div>
            </BentoCard>
          )}

          {/* ── Contributeur à la une (full width banner) ── */}
          {topContributor && (
            <BentoCard className="md:col-span-full lg:col-span-full bg-accent p-4 md:p-5">
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
