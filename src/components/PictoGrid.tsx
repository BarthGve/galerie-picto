import { useState } from "react";
import type { Pictogram, Gallery } from "@/lib/types";
import { PictoCard } from "./PictoCard";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 60;

interface PictoGridProps {
  pictograms: Pictogram[];
  galleries?: Gallery[];
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromGallery?: (
    galleryId: string,
    pictogramId: string,
  ) => Promise<boolean>;
  isAuthenticated?: boolean;
  selectedGalleryId?: string | null;
  onPictogramUpdated?: () => void;
  onDeletePictogram?: (id: string) => Promise<boolean>;
}

export function PictoGrid({
  pictograms,
  galleries,
  onAddToGallery,
  onRemoveFromGallery,
  isAuthenticated,
  selectedGalleryId,
  onPictogramUpdated,
  onDeletePictogram,
}: PictoGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (pictograms.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          Aucun pictogramme trouvé
        </p>
      </div>
    );
  }

  const visiblePictograms = pictograms.slice(0, visibleCount);
  const remaining = pictograms.length - visibleCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {visiblePictograms.map((pictogram) => (
          <PictoCard
            key={pictogram.id}
            pictogram={pictogram}
            galleries={galleries}
            onAddToGallery={onAddToGallery}
            onRemoveFromGallery={onRemoveFromGallery}
            isAuthenticated={isAuthenticated}
            selectedGalleryId={selectedGalleryId}
            onPictogramUpdated={onPictogramUpdated}
            onDeletePictogram={onDeletePictogram}
          />
        ))}
      </div>
      {remaining > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Afficher plus ({remaining} restants)
          </Button>
        </div>
      )}
    </div>
  );
}
