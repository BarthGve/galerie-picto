import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Pictogram, Gallery } from "@/lib/types";
import { fetchSvgText } from "@/lib/svg-to-png";
import { PictoModal } from "./PictoModal";
import { GallerySelector } from "./GallerySelector";
import { toast } from "sonner";

interface PictoCardProps {
  pictogram: Pictogram;
  galleries?: Gallery[];
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromGallery?: (
    galleryId: string,
    pictogramId: string,
  ) => Promise<boolean>;
  isAuthenticated?: boolean;
  selectedGalleryId?: string | null;
}

export function PictoCard({
  pictogram,
  galleries,
  onAddToGallery,
  onRemoveFromGallery,
  isAuthenticated,
  selectedGalleryId,
}: PictoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const svgCacheRef = useRef<string | null>(null);

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
      toast.error("SVG en cours de chargement, reessayez");
      return;
    }
    try {
      await navigator.clipboard.writeText(svgCacheRef.current);
      setCopied(true);
      toast.success("Code SVG copie");
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

  const pictoGalleries =
    galleries?.filter((g) => g.pictogramIds.includes(pictogram.id)) ?? [];

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={prefetchSvg}
      >
        <div className="aspect-square p-6 flex items-center justify-center bg-muted/30">
          <img
            src={pictogram.url}
            alt={pictogram.name}
            className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
          />
        </div>

        {/* Quick actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {showGallerySelector && (
            <GallerySelector
              galleries={galleries}
              pictogramId={pictogram.id}
              onAdd={onAddToGallery}
              onRemove={onRemoveFromGallery}
              variant="compact"
            />
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="p-4 border-t">
          <h3 className="font-semibold text-sm truncate mb-2">
            {pictogram.name}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(pictogram.size)}
            </Badge>
            <span>SVG</span>
          </div>
          {!selectedGalleryId && pictoGalleries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {pictoGalleries.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-muted text-muted-foreground"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: g.color || "var(--muted-foreground)",
                      opacity: g.color ? 1 : 0.3,
                    }}
                  />
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <PictoModal
        pictogram={pictogram}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        galleries={galleries}
        onAddToGallery={onAddToGallery}
        onRemoveFromGallery={onRemoveFromGallery}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
