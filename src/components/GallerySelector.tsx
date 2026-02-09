import { FolderPlus, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Gallery } from "@/lib/types";
import { toast } from "sonner";

interface GallerySelectorProps {
  galleries: Gallery[];
  pictogramId: string;
  onAdd: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onRemove: (galleryId: string, pictogramId: string) => Promise<boolean>;
  variant: "compact" | "full";
}

export function GallerySelector({
  galleries,
  pictogramId,
  onAdd,
  onRemove,
  variant,
}: GallerySelectorProps) {
  if (galleries.length === 0) return null;

  const isInAnyGallery = galleries.some((g) =>
    g.pictogramIds.includes(pictogramId),
  );

  const handleToggle = async (gallery: Gallery, checked: boolean) => {
    if (checked) {
      const ok = await onAdd(gallery.id, pictogramId);
      if (ok) toast.success(`Ajouté à ${gallery.name}`);
    } else {
      const ok = await onRemove(gallery.id, pictogramId);
      if (ok) toast.success(`Retiré de ${gallery.name}`);
    }
  };

  const galleryList = (
    <div className="space-y-2">
      {galleries.map((gallery) => {
        const isChecked = gallery.pictogramIds.includes(pictogramId);
        return (
          <label
            key={gallery.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded px-2 py-1.5"
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleToggle(gallery, checked === true)
              }
            />
            <span
              className="size-3 shrink-0 rounded-full"
              style={{
                backgroundColor: gallery.color || "var(--muted-foreground)",
                opacity: gallery.color ? 1 : 0.3,
              }}
            />
            <span className="text-sm">{gallery.name}</span>
          </label>
        );
      })}
    </div>
  );

  if (variant === "full") {
    return (
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Collections</span>
        {galleryList}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {isInAnyGallery ? (
            <Folder className="h-4 w-4" />
          ) : (
            <FolderPlus className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
          Collections
        </p>
        {galleryList}
      </PopoverContent>
    </Popover>
  );
}
