import { useMemo, useState } from "react";
import {
  Filter,
  ArrowUpDown,
  Minimize2,
  Maximize2,
  Search,
} from "lucide-react";
import type { Pictogram, Gallery } from "@/lib/types";
import { PictoCard } from "./PictoCard";

const PAGE_SIZE = 20;

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
}: PictoGridProps) {
  const [compact, setCompact] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Extract top tags from pictograms
  const topTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const p of pictograms) {
      for (const t of p.tags ?? []) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [pictograms]);

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

  const cycleSortKey = () => {
    setSortKey((prev) =>
      prev === "date" ? "name" : prev === "name" ? "size" : "date",
    );
  };

  const sortLabel = sortKey === "date" ? "Date" : sortKey === "name" ? "Nom" : "Taille";


  return (
    <div className="space-y-6">
      {/* ── Floating Toolbar ── */}
      <div className="flex items-center justify-between bg-card/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-xl shadow-muted/20">
        <div className="flex items-center gap-1 overflow-x-auto px-1" style={{ scrollbarWidth: "none" }}>
          <div className="p-2 text-muted-foreground shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <button
            onClick={() => { setActiveTag(null); onPageChange(1); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              !activeTag
                ? "bg-foreground text-background shadow-md"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            Tous
          </button>
          {topTags.map((tag) => (
            <button
              key={tag}
              onClick={() => { setActiveTag(activeTag === tag ? null : tag); onPageChange(1); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTag === tag
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:bg-accent"
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
            className="px-6 py-3 rounded-xl bg-foreground text-background font-bold text-sm shadow-xl hover:scale-105 transition-transform"
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
            />
          ))}
        </div>
      )}

    </div>
  );
}
