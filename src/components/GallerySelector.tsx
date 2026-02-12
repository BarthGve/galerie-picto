import { FolderPlus, Folder, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Gallery } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);

  if (galleries.length === 0) return null;

  const isInAnyGallery = galleries.some((g) =>
    g.pictogramIds.includes(pictogramId),
  );

  const handleToggle = async (gallery: Gallery, checked?: boolean) => {
    const isChecked =
      checked !== undefined
        ? checked
        : !gallery.pictogramIds.includes(pictogramId);
    if (isChecked) {
      const ok = await onAdd(gallery.id, pictogramId);
      if (ok) toast.success(`Ajouté à ${gallery.name}`);
    } else {
      const ok = await onRemove(gallery.id, pictogramId);
      if (ok) toast.success(`Retiré de ${gallery.name}`);
    }
  };

  // Variant "full" = combobox dans la modale
  if (variant === "full") {
    const selectedGalleries = galleries.filter((g) =>
      g.pictogramIds.includes(pictogramId),
    );

    return (
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Collections</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between font-normal"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedGalleries.length > 0 ? (
                <span className="flex items-center gap-1.5 truncate">
                  {selectedGalleries.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: g.color || "var(--muted-foreground)",
                          opacity: g.color ? 1 : 0.3,
                        }}
                      />
                      {g.name}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Choisir des collections...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <Command>
              <CommandInput placeholder="Rechercher..." />
              <CommandList>
                <CommandEmpty>Aucune collection</CommandEmpty>
                <CommandGroup>
                  {galleries.map((gallery) => {
                    const isChecked =
                      gallery.pictogramIds.includes(pictogramId);
                    return (
                      <CommandItem
                        key={gallery.id}
                        value={gallery.name}
                        onSelect={() => handleToggle(gallery)}
                        data-checked={isChecked}
                      >
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              gallery.color || "var(--muted-foreground)",
                            opacity: gallery.color ? 1 : 0.3,
                          }}
                        />
                        <span>{gallery.name}</span>
                        <Check
                          className={`ml-auto h-4 w-4 ${isChecked ? "opacity-100" : "opacity-0"}`}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Variant "compact" = checkboxes dans un popover (carte)
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
      </PopoverContent>
    </Popover>
  );
}
