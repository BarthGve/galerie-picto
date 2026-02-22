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
  onDeletePictogram,
}: CollectionsPageProps) {
  const onGoGalleryRef = useRef(onGoGallery);
  useEffect(() => { onGoGalleryRef.current = onGoGallery; });

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
            <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 leading-none">
              {col.pictogramIds.length + col.userPictogramIds.length} picto{(col.pictogramIds.length + col.userPictogramIds.length) !== 1 ? "s" : ""}
            </span>
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
