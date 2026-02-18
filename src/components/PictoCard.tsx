import { lazy, Suspense, useRef, useState } from "react";
import { Copy, Check, Download, Heart, BookmarkPlus, Bookmark, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Pictogram, Gallery, UserCollection } from "@/lib/types";
import { fetchSvgText } from "@/lib/svg-to-png";
import { usePictogramUrl } from "@/hooks/usePictogramUrl";
import { GallerySelector } from "./GallerySelector";
import { toast } from "sonner";
import { useDownloads } from "@/hooks/useDownloads";

const PictoModal = lazy(() =>
  import("./PictoModal").then((m) => ({ default: m.PictoModal })),
);

function UserCollectionButton({
  pictogramId,
  userCollections,
  onAdd,
  onRemove,
}: {
  pictogramId: string;
  userCollections: UserCollection[];
  onAdd: (collectionId: string, pictogramId: string) => Promise<boolean>;
  onRemove?: (collectionId: string, pictogramId: string) => Promise<void>;
}) {
  const isInAny = userCollections.some((c) => c.pictogramIds.includes(pictogramId));

  const handleToggle = async (col: UserCollection, checked: boolean) => {
    if (checked) {
      await onAdd(col.id, pictogramId);
    } else if (onRemove) {
      await onRemove(col.id, pictogramId);
      toast.success(`Retiré de « ${col.name} »`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 rounded-lg border border-border shadow-sm"
          onClick={(e) => e.stopPropagation()}
          title="Mes collections"
        >
          {isInAny ? (
            <Bookmark className="h-4 w-4 text-primary fill-primary/20" />
          ) : (
            <BookmarkPlus className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-52 p-2"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
          Mes collections
        </p>
        <div className="space-y-1">
          {userCollections.map((col) => {
            const checked = col.pictogramIds.includes(pictogramId);
            return (
              <label
                key={col.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded px-2 py-1.5"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => handleToggle(col, v === true)}
                />
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: col.color ?? "var(--muted-foreground)",
                    opacity: col.color ? 1 : 0.3,
                  }}
                />
                <span className="text-sm truncate">{col.name}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PictoCardProps {
  pictogram: Pictogram;
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
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onLogin?: () => void;
  compact?: boolean;
  userCollections?: UserCollection[];
  onAddToUserCollection?: (collectionId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromUserCollection?: (collectionId: string, pictogramId: string) => Promise<void>;
  likeCount?: number;
  hasLiked?: boolean;
  onToggleLike?: () => void;
}

export function PictoCard({
  pictogram,
  galleries,
  onAddToGallery,
  onRemoveFromGallery,
  isAuthenticated,
  user,
  onPictogramUpdated,
  onDeletePictogram,
  isFavorite,
  onToggleFavorite,
  onLogin,
  compact,
  userCollections,
  onAddToUserCollection,
  onRemoveFromUserCollection,
  likeCount = 0,
  hasLiked,
  onToggleLike,
}: PictoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const svgCacheRef = useRef<string | null>(null);
  const displayUrl = usePictogramUrl(pictogram);
  const { getCount } = useDownloads();
  const downloadCount = getCount(pictogram.id);

  const prefetchSvg = () => {
    if (!svgCacheRef.current) {
      fetchSvgText(pictogram.url).then((text) => {
        svgCacheRef.current = text;
      });
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgCacheRef.current) {
      toast.error("SVG en cours de chargement, réessayez");
      return;
    }
    try {
      await navigator.clipboard.writeText(svgCacheRef.current);
      setCopied(true);
      toast.success("Code SVG copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const showGallerySelector =
    isAuthenticated &&
    galleries &&
    galleries.length > 0 &&
    onAddToGallery &&
    onRemoveFromGallery;

  return (
    <>
      <Card
        className={`group relative overflow-hidden rounded border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${compact ? "p-0" : ""}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("application/pictogram-id", pictogram.id);
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={prefetchSvg}
      >
        <div className={`relative flex items-center justify-center ${compact ? "aspect-square p-2" : "aspect-[4/3] p-4"}`}>
          <img
            src={displayUrl}
            alt={pictogram.name || pictogram.filename.replace(/\.svg$/i, "")}
            loading="lazy"
            decoding="async"
            width={128}
            height={128}
            className={`w-full h-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110 ${compact ? "max-w-12 max-h-12" : "max-w-24 max-h-24"}`}
          />
          <div className="absolute inset-4 bg-foreground/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* Favorite button - always visible when favorited */}
        {onToggleFavorite && (
          <button
            className={`absolute top-2 left-2 z-10 transition-opacity ${isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Heart
              className="h-5 w-5 transition-colors"
              style={isFavorite ? {
                color: "var(--dsfr-pink-macaron-main)",
                fill: "var(--dsfr-pink-macaron-850)",
              } : {
                color: "var(--muted-foreground)",
              }}
            />
          </button>
        )}

        {/* Quick actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-20">
          {showGallerySelector && (
            <GallerySelector
              galleries={galleries}
              pictogramId={pictogram.id}
              onAdd={onAddToGallery}
              onRemove={onRemoveFromGallery}
              variant="compact"
            />
          )}
          {userCollections && userCollections.length > 0 && onAddToUserCollection && (
            <UserCollectionButton
              pictogramId={pictogram.id}
              userCollections={userCollections}
              onAdd={onAddToUserCollection}
              onRemove={onRemoveFromUserCollection}
            />
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-lg border border-border shadow-sm"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {compact ? (
          <div className="px-2 pb-2 pt-1">
            <h3 className="font-bold text-xs text-foreground truncate leading-tight text-center">
              {pictogram.name || pictogram.filename.replace(/\.svg$/i, "")}
            </h3>
          </div>
        ) : (
          <div className="px-3 pb-3 pt-2 border-t border-border space-y-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-extrabold text-sm text-foreground truncate leading-tight flex-1">
                {pictogram.name || pictogram.filename.replace(/\.svg$/i, "")}
              </h3>
              {(likeCount > 0 || isAuthenticated) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike?.();
                  }}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-0.5 text-[10px] shrink-0 transition-colors ${
                    hasLiked
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  } disabled:cursor-default disabled:hover:text-muted-foreground`}
                  title={isAuthenticated ? (hasLiked ? "Retirer mon like" : "Liker") : undefined}
                >
                  <ThumbsUp className={`size-2.5 ${hasLiked ? "fill-primary/30" : ""}`} />
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-[4px]" style={{ backgroundColor: 'var(--dsfr-green-tilleul-verveine-975)', borderColor: 'var(--dsfr-green-tilleul-verveine-850)', color: 'var(--dsfr-green-tilleul-verveine-sun)' }}>
                  {formatFileSize(pictogram.size)}
                </Badge>
                {downloadCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-badge-download-text">
                    <Download className="size-2.5" />
                    {downloadCount}
                  </span>
                )}
              </div>
              {pictogram.contributor && (
                <div className="flex items-center gap-1">
                  <img
                    src={pictogram.contributor.githubAvatarUrl}
                    alt={pictogram.contributor.githubUsername}
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-ring-accent"
                  />
                  <span className="truncate max-w-[70px] text-[10px]">
                    {pictogram.contributor.githubUsername}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <Suspense fallback={null}>
          <PictoModal
            pictogram={pictogram}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            galleries={galleries}
            onAddToGallery={onAddToGallery}
            onRemoveFromGallery={onRemoveFromGallery}
            isAuthenticated={isAuthenticated}
            user={user}
            onPictogramUpdated={onPictogramUpdated}
            onDeletePictogram={onDeletePictogram}
            onLogin={onLogin}
          />
        </Suspense>
      )}
    </>
  );
}
