import { useEffect, useRef } from "react";
import { FolderOpen } from "lucide-react";
import { PictoGrid } from "@/components/PictoGrid";
import type { Pictogram, Gallery, UserCollection } from "@/lib/types";
import type { GitHubUser } from "@/lib/github-auth";

interface CollectionsPageProps {
  user: GitHubUser | null;
  onGoGallery: () => void;
  selectedUserCollectionId: string | null;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (value: boolean) => void;
  userCollections: UserCollection[];
  filteredPictograms: Pictogram[];
  galleries: Gallery[];
  isAuthenticated: boolean;
  onPictogramUpdated: () => Promise<void>;
  currentPage: number;
  onPageChange: (page: number) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onLogin: () => void;
  onAddToUserCollection?: (collectionId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromUserCollection?: (collectionId: string, pictogramId: string) => Promise<void>;
  getLikeCount: (id: string) => number;
  hasLiked: (id: string) => boolean;
  onToggleLike?: (id: string) => void;
  privateIds?: Set<string>;
  onDeletePrivatePictogram?: (id: string) => void;
  onUploadSvgClick: () => void;
  onDeletePictogram?: (id: string) => Promise<boolean>;
}

export function CollectionsPage({
  user,
  onGoGallery,
  selectedUserCollectionId,
  showFavoritesOnly,
  setShowFavoritesOnly,
  userCollections,
  filteredPictograms,
  galleries,
  isAuthenticated,
  onPictogramUpdated,
  currentPage,
  onPageChange,
  isFavorite,
  onToggleFavorite,
  onLogin,
  onAddToUserCollection,
  onRemoveFromUserCollection,
  getLikeCount,
  hasLiked,
  onToggleLike,
  privateIds,
  onDeletePrivatePictogram,
  onUploadSvgClick,
  onDeletePictogram,
}: CollectionsPageProps) {
  const onGoGalleryRef = useRef(onGoGallery);
  onGoGalleryRef.current = onGoGallery;

  // Rediriger vers gallery si non connecté
  useEffect(() => {
    if (!user) {
      onGoGalleryRef.current();
    }
  }, [user]);

  // État vide : aucune collection ni favoris sélectionnés
  if (!selectedUserCollectionId && !showFavoritesOnly) {
    return (
      <div className="flex-1 overflow-y-auto pb-12">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">Mes Collections</h2>
        </div>
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
          <FolderOpen className="size-12 opacity-40" />
          <p className="text-base">Sélectionnez une collection dans la barre latérale</p>
        </div>
      </div>
    );
  }

  const col = selectedUserCollectionId
    ? userCollections.find((c) => c.id === selectedUserCollectionId)
    : null;

  return (
    <div className="flex-1 overflow-y-auto pb-12">
      {/* En-tête contextuel : collection utilisateur */}
      {col && (
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: col.color ?? "var(--muted-foreground)", opacity: col.color ? 1 : 0.4 }}
            />
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">{col.name}</h2>
            <span className="text-xs text-muted-foreground font-medium">
              {col.pictogramIds.length + col.userPictogramIds.length} picto{(col.pictogramIds.length + col.userPictogramIds.length) !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onUploadSvgClick}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-primary text-primary-foreground text-xs font-bold hover:bg-(--primary-hover) active:bg-(--primary-active) transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Ajouter un SVG perso
            </button>
          </div>
          {col.description && (
            <p className="text-sm text-muted-foreground pl-6">{col.description}</p>
          )}
        </div>
      )}

      {/* En-tête contextuel : favoris */}
      {showFavoritesOnly && (
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">Mes Favoris</h2>
            <button
              onClick={() => {
                setShowFavoritesOnly(false);
                onGoGallery();
              }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-input bg-background text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-all"
            >
              Désactiver
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <PictoGrid
          key={`collections|${selectedUserCollectionId ?? ""}|${showFavoritesOnly ? "fav" : ""}`}
          pictograms={filteredPictograms}
          galleries={galleries}
          isAuthenticated={isAuthenticated}
          user={user}
          onPictogramUpdated={onPictogramUpdated}
          onDeletePictogram={onDeletePictogram}
          page={currentPage}
          onPageChange={onPageChange}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onLogin={onLogin}
          userCollections={user ? userCollections : undefined}
          onAddToUserCollection={onAddToUserCollection}
          onRemoveFromUserCollection={onRemoveFromUserCollection}
          getLikeCount={getLikeCount}
          hasLiked={hasLiked}
          onToggleLike={onToggleLike}
          privateIds={privateIds}
          onDeletePrivatePictogram={onDeletePrivatePictogram}
        />
      </div>
    </div>
  );
}
