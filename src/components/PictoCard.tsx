import { lazy, memo, Suspense, useEffect, useRef, useState } from "react";
import { Copy, Check, Download, Heart, BookmarkPlus, Bookmark, ThumbsUp, Lock, Trash2, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Pictogram, Gallery, UserCollection } from "@/lib/types";
import { fetchSvgText } from "@/lib/svg-to-png";
import { usePictogramUrl } from "@/hooks/usePictogramUrl";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { GallerySelector } from "./GallerySelector";
import { toast } from "sonner";
import { useDownloads } from "@/hooks/useDownloads";

const PictoModal = lazy(() =>
  import("./PictoModal").then((m) => ({ default: m.PictoModal })),
);

const ColorCustomizer = lazy(() =>
  import("./ColorCustomizer").then((m) => ({ default: m.ColorCustomizer })),
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
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 rounded-lg border border-border shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {isInAny ? (
                <Bookmark className="h-4 w-4 text-primary fill-primary/20" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          {isInAny ? "Gérer mes collections" : "Ajouter à une collection"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-52 p-2"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
          Mes collections
        </p>
        {userCollections.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-1 italic">
            Aucune collection. Créez-en une depuis la sidebar.
          </p>
        ) : (
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
        )}
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
  onToggleFavorite?: (id: string) => void;
  onLogin?: () => void;
  compact?: boolean;
  userCollections?: UserCollection[];
  onAddToUserCollection?: (collectionId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromUserCollection?: (collectionId: string, pictogramId: string) => Promise<void>;
  likeCount?: number;
  hasLiked?: boolean;
  onToggleLike?: (id: string) => void;
  isPrivate?: boolean;
  onDeletePrivatePictogram?: (id: string) => void;
  actionsPosition?: "right" | "bottom";
}

function PictoCardInner({
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
  isPrivate,
  onDeletePrivatePictogram,
  actionsPosition = "right",
}: PictoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardModifiedSvg, setCardModifiedSvg] = useState<string | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [svgText, setSvgText] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const svgCacheRef = useRef<string | null>(null);
  const displayUrl = usePictogramUrl(pictogram);

  // Blob URL pour la preview dans la card quand les couleurs sont modifiées
  useEffect(() => {
    if (cardModifiedSvg) {
      const blob = new Blob([cardModifiedSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derived state from effect-created blob URL
      setCardPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCardPreviewUrl(null);
  }, [cardModifiedSvg]);
  const { getCount } = useDownloads();
  const downloadCount = getCount(pictogram.id);

  const prefetchSvg = () => {
    if (!svgCacheRef.current) {
      fetchSvgText(pictogram.url).then((text) => {
        svgCacheRef.current = text;
        setSvgText(text);
      });
    }
  };

  const handlePaletteOpen = (open: boolean) => {
    setIsPaletteOpen(open);
    if (open && !svgCacheRef.current) {
      fetchSvgText(pictogram.url)
        .then((text) => {
          svgCacheRef.current = text;
          setSvgText(text);
        })
        .catch(() => {
          toast.error("Impossible de charger ce pictogramme");
          setIsPaletteOpen(false);
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

  const tooltipSide = actionsPosition === "bottom" ? "top" as const : "left" as const;

  const quickActionButtons = (
    <>
      {showGallerySelector && (
        <GallerySelector
          galleries={galleries}
          pictogramId={pictogram.id}
          onAdd={onAddToGallery}
          onRemove={onRemoveFromGallery}
          variant="compact"
        />
      )}
      {userCollections !== undefined && onAddToUserCollection && (
        <UserCollectionButton
          pictogramId={pictogram.id}
          userCollections={userCollections}
          onAdd={onAddToUserCollection}
          onRemove={onRemoveFromUserCollection}
        />
      )}
      {isAuthenticated && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 rounded-lg bg-background shadow-md border border-border hover:shadow-lg transition-all"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            {copied ? "Copié !" : "Copier le SVG"}
          </TooltipContent>
        </Tooltip>
      )}
      {isAuthenticated && (
        <Popover open={isPaletteOpen} onOpenChange={handlePaletteOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className={`h-8 w-8 p-0 rounded-lg shadow-md border hover:shadow-lg transition-all ${cardModifiedSvg ? "border-primary/60 bg-primary/10 text-primary" : "bg-background border-border"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side={tooltipSide}>
              {cardModifiedSvg ? "Couleurs personnalisées" : "Personnaliser les couleurs"}
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            className="w-80"
            align="end"
            sideOffset={8}
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense
              fallback={
                <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
                  Chargement…
                </div>
              }
            >
              {svgText ? (
                <ColorCustomizer
                  svgText={svgText}
                  onModifiedSvgChange={(svg) => setCardModifiedSvg(svg)}
                />
              ) : (
                <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
                  Chargement du SVG…
                </div>
              )}
            </Suspense>
          </PopoverContent>
        </Popover>
      )}
    </>
  );

  return (
    <>
      <Card
          className={`group relative overflow-hidden rounded-xl bg-card transition-all duration-300 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] ${compact ? "p-0" : ""}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/pictogram-id", pictogram.id);
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={prefetchSvg}
        >
          {/* Zone pictogramme */}
          <div className={`relative flex items-center justify-center bg-card ${compact ? "aspect-square p-2" : "aspect-[4/3] p-6"}`}>
            <img
              src={cardPreviewUrl || displayUrl}
              alt={pictogram.name || pictogram.filename.replace(/\.svg$/i, "")}
              loading="lazy"
              decoding="async"
              width={128}
              height={128}
              className={`w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110 ${compact ? "max-w-12 max-h-12" : "max-w-24 max-h-24"}`}
            />
            {/* Quick actions bottom — inside image area */}
            {actionsPosition === "bottom" && !isPrivate && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-row items-center gap-1 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                {quickActionButtons}
              </div>
            )}
          </div>

          {/* Favorite button - always visible when favorited */}
          {onToggleFavorite && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`absolute top-3 left-3 z-10 transition-all duration-200 ${isFavorite ? "opacity-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"}`}
                  aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(pictogram.id);
                  }}
                >
                  <Heart
                    className="h-5 w-5 drop-shadow-sm transition-colors"
                    style={isFavorite ? {
                      color: "var(--destructive)",
                      fill: "var(--destructive)",
                    } : {
                      color: "var(--muted-foreground)",
                    }}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Badge privé */}
          {isPrivate && (
            <span className="absolute top-3 left-3 z-10 flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 border border-border shadow-sm">
              <Lock className="size-2.5" />
              Privé
            </span>
          )}

          {/* Bouton suppression picto privé */}
          {isPrivate && onDeletePrivatePictogram && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(true);
                    }}
                    className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 rounded-lg bg-background shadow-md border border-border text-muted-foreground hover:text-destructive hover:shadow-lg"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Supprimer</TooltipContent>
              </Tooltip>
              <DeleteConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                onConfirm={() => {
                  setConfirmDelete(false);
                  onDeletePrivatePictogram(pictogram.id);
                }}
                title="Supprimer ce pictogramme ?"
                description={<>Le pictogramme <span className="font-semibold">« {pictogram.name || pictogram.filename.replace(/\.svg$/i, "")} »</span> sera supprimé définitivement de votre espace personnel et retiré de toutes vos collections.</>}
              />
            </>
          )}

          {/* Quick actions right — slide in from right */}
          {actionsPosition === "right" && !isPrivate && (
            <div className="absolute top-3 right-0 flex flex-col gap-1 z-20 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:right-3 transition-all duration-300">
              {quickActionButtons}
            </div>
          )}

          {compact ? (
            <div className="px-2 pb-1.5 pt-0.5">
              <h3 className="font-bold text-xs text-foreground truncate leading-tight text-center">
                {pictogram.name || pictogram.filename.replace(/\.svg$/i, "")}
              </h3>
            </div>
          ) : (
            <div className="px-3 pb-0 pt-2 space-y-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-extrabold text-sm text-foreground truncate leading-tight flex-1">
                  {pictogram.name || pictogram.filename.replace(/\.svg$/i, "")}
                </h3>
                {!isPrivate && (likeCount > 0 || isAuthenticated) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike?.(pictogram.id);
                        }}
                        disabled={!isAuthenticated}
                        className={`flex items-center gap-0.5 text-[10px] shrink-0 px-1.5 py-0.5 rounded-full transition-all ${
                          hasLiked
                            ? "text-primary-foreground bg-primary"
                            : "text-muted-foreground hover:bg-muted"
                        } disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-muted-foreground`}
                      >
                        <ThumbsUp className={`size-2.5 ${hasLiked ? "fill-primary-foreground" : ""}`} />
                        {likeCount > 0 && <span className="font-bold">{likeCount}</span>}
                      </button>
                    </TooltipTrigger>
                    {isAuthenticated && (
                      <TooltipContent>
                        {hasLiked ? "Retirer mon like" : "Liker"}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                  {formatFileSize(pictogram.size)}
                </span>
                {downloadCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                    <Download className="size-2.5" />
                    {downloadCount}
                  </span>
                )}
                {(() => {
                  const galleryName = pictogram.galleryIds?.[0] && galleries?.find(g => g.id === pictogram.galleryIds![0])?.name;
                  return galleryName ? (
                    <span className="text-[10px] truncate text-muted-foreground">
                      {galleryName}
                    </span>
                  ) : null;
                })()}
                {pictogram.contributor && (
                  <div className="flex items-center gap-1 ml-auto shrink-0">
                    <img
                      src={pictogram.contributor.githubAvatarUrl}
                      alt={pictogram.contributor.githubUsername}
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-card"
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
              onDeletePictogram={isPrivate ? undefined : onDeletePictogram}
              onLogin={onLogin}
              isPrivate={isPrivate}
              initialModifiedSvg={cardModifiedSvg}
            />
          </Suspense>
        )}
    </>
  );
}

export const PictoCard = memo(PictoCardInner);
