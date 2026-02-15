import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pictogram, Gallery } from "@/lib/types";
import { PictoCard } from "./PictoCard";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 50;

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
}: PictoGridProps) {
  const totalPages = Math.max(1, Math.ceil(pictograms.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visiblePictograms = useMemo(
    () => pictograms.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [pictograms, safePage],
  );

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (pictograms.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          Aucun pictogramme trouvé
        </p>
      </div>
    );
  }

  // Build page numbers to display (max 5 visible)
  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6 lg:gap-8">
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
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage <= 1}
            onClick={() => handlePageChange(safePage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {start > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
              {start > 2 && (
                <span className="px-1 text-muted-foreground text-sm">...</span>
              )}
            </>
          )}

          {pageNumbers.map((p) => (
            <Button
              key={p}
              variant={p === safePage ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(p)}
            >
              {p}
            </Button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span className="px-1 text-muted-foreground text-sm">...</span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={safePage >= totalPages}
            onClick={() => handlePageChange(safePage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="ml-2 text-xs text-muted-foreground tabular-nums">
            {(safePage - 1) * PAGE_SIZE + 1}-
            {Math.min(safePage * PAGE_SIZE, pictograms.length)} sur{" "}
            {pictograms.length}
          </span>
        </div>
      )}
    </div>
  );
}
