import type { Pictogram, Gallery } from "@/lib/types";
import { PictoCard } from "./PictoCard";

interface PictoGridProps {
  pictograms: Pictogram[];
  galleries?: Gallery[];
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromGallery?: (
    galleryId: string,
    pictogramId: string,
  ) => Promise<boolean>;
  isAuthenticated?: boolean;
}

export function PictoGrid({
  pictograms,
  galleries,
  onAddToGallery,
  onRemoveFromGallery,
  isAuthenticated,
}: PictoGridProps) {
  if (pictograms.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          Aucun pictogramme trouvé
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
      {pictograms.map((pictogram) => (
        <PictoCard
          key={pictogram.id}
          pictogram={pictogram}
          galleries={galleries}
          onAddToGallery={onAddToGallery}
          onRemoveFromGallery={onRemoveFromGallery}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}
