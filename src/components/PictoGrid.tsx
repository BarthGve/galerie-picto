import { useMemo, useState } from "react";
import {
  Filter,
  ArrowUpDown,
  Minimize2,
  Maximize2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Pictogram, Gallery, UserCollection } from "@/lib/types";
import { PictoCard } from "./PictoCard";
import { useDarkPrefetch } from "@/hooks/useDarkPrefetch";

const PAGE_SIZE = 50;

type SortKey = "name" | "date" | "size";

interface PictoGridProps {
  pictograms: Pictogram[];
  galleries?: Gallery[];
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromGallery?: (
    galleryId: string,
    pictogramId: string,
  ) => Promise<boolean>;
  isAuthenticated?: boolean;
  user?: { login: string; avatar_url: string } | null;
  selectedGalleryId?: string | null;
  onPictogramUpdated?: () => void;
  onDeletePictogram?: (id: string) => Promise<boolean>;
  page: number;
  onPageChange: (page: number) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  onLogin?: () => void;
  userCollections?: UserCollection[];
  onAddToUserCollection?: (collectionId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromUserCollection?: (collectionId: string, pictogramId: string) => Promise<void>;
  getLikeCount?: (id: string) => number;
  hasLiked?: (id: string) => boolean;
  onToggleLike?: (id: string) => void;
  privateIds?: Set<string>;
  onDeletePrivatePictogram?: (id: string) => void;
}

export function PictoGrid({
  pictograms,
  galleries,
  onAddToGallery,
  onRemoveFromGallery,
  isAuthenticated,
  user,
  selectedGalleryId,
  onPictogramUpdated,
  onDeletePictogram,
  page,
  onPageChange,
  isFavorite,
  onToggleFavorite,
  onLogin,
  userCollections,
  onAddToUserCollection,
  onRemoveFromUserCollection,
  getLikeCount,
  hasLiked,
  onToggleLike,
  privateIds,
  onDeletePrivatePictogram,
}: PictoGridProps) {
  const [compact, setCompact] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Extract top tags from pictograms — exclure les pictos privés
  const topTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const p of pictograms) {
      if (privateIds?.has(p.id)) continue;
      for (const t of p.tags ?? []) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [pictograms, privateIds]);

  // Filter by tag
  const tagFiltered = useMemo(() => {
    if (!activeTag) return pictograms;
    return pictograms.filter((p) => p.tags?.includes(activeTag));
  }, [pictograms, activeTag]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...tagFiltered];
    if (sortKey === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "size") arr.sort((a, b) => b.size - a.size);
    else arr.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    return arr;
  }, [tagFiltered, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visiblePictograms = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  // Prefetch batch des SVGs dark pour tous les pictos visibles
  const visibleUrls = useMemo(
    () => visiblePictograms.map((p) => p.url),
    [visiblePictograms],
  );
  useDarkPrefetch(visibleUrls);

  const cycleSortKey = () => {
    setSortKey((prev) =>
      prev === "date" ? "name" : prev === "name" ? "size" : "date",
    );
  };

  const sortLabel = sortKey === "date" ? "Date" : sortKey === "name" ? "Nom" : "Taille";


  return (
    <div className="space-y-6">
      {/* ── Floating Toolbar ── */}
      <div className="sticky top-0 z-20 pt-4 pb-2 -mt-4">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-1 overflow-x-auto px-1" style={{ scrollbarWidth: "none" }}>
          <div className="p-2 text-muted-foreground shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <button
            onClick={() => { setActiveTag(null); onPageChange(1); }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              !activeTag
                ? "bg-accent text-primary border-primary/30"
                : "bg-accent text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Tous
          </button>
          {topTags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setActiveTag(activeTag === tag ? null : tag); onPageChange(1); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                activeTag === tag
                  ? "bg-accent text-primary border-primary/30"
                  : "bg-accent text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-2 border-l border-border shrink-0">
          <button
            onClick={cycleSortKey}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-xl text-xs font-bold text-muted-foreground transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden md:inline">Tri: {sortLabel}</span>
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex bg-accent p-1 rounded-xl">
            <button
              onClick={() => setCompact(true)}
              className={`p-1.5 rounded-lg transition-all ${compact ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCompact(false)}
              className={`p-1.5 rounded-lg transition-all ${!compact ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* ── Grid ── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-20 rounded-full animate-pulse" />
            <Search className="w-20 h-20 text-muted-foreground/30 relative z-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Aucun résultat trouvé</h2>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium mb-8">
            Nous n'avons trouvé aucun pictogramme correspondant à vos filtres actuels. Essayez d'autres mots-clés.
          </p>
          <button
            onClick={() => { setActiveTag(null); onPageChange(1); }}
            className="px-6 py-3 rounded-[4px] bg-foreground text-background font-bold text-sm shadow-xl hover:scale-105 transition-transform"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div
          className={
            compact
              ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3"
              : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6"
          }
        >
          {visiblePictograms.map((pictogram) => (
            <PictoCard
              key={pictogram.id}
              pictogram={pictogram}
              galleries={galleries}
              onAddToGallery={onAddToGallery}
              onRemoveFromGallery={onRemoveFromGallery}
              isAuthenticated={isAuthenticated}
              user={user}
              selectedGalleryId={selectedGalleryId}
              onPictogramUpdated={onPictogramUpdated}
              onDeletePictogram={onDeletePictogram}
              isFavorite={isFavorite?.(pictogram.id)}
              onToggleFavorite={
                isAuthenticated && onToggleFavorite
                  ? () => onToggleFavorite(pictogram.id)
                  : undefined
              }
              onLogin={onLogin}
              compact={compact}
              userCollections={userCollections}
              onAddToUserCollection={onAddToUserCollection}
              onRemoveFromUserCollection={onRemoveFromUserCollection}
              likeCount={getLikeCount?.(pictogram.id)}
              hasLiked={hasLiked?.(pictogram.id)}
              onToggleLike={onToggleLike ? () => onToggleLike(pictogram.id) : undefined}
              isPrivate={privateIds?.has(pictogram.id)}
              onDeletePrivatePictogram={onDeletePrivatePictogram}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            disabled={safePage <= 1}
            onClick={() => { onPageChange(safePage - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-muted-foreground tabular-nums">
            Page <span className="text-foreground">{safePage}</span> sur {totalPages}
            <span className="text-muted-foreground/60 ml-2">({sorted.length} pictos)</span>
          </span>
          <button
            disabled={safePage >= totalPages}
            onClick={() => { onPageChange(safePage + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

    </div>
  );
}
