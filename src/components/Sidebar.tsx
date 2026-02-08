import { useState } from "react";
import { Images, Plus, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Gallery } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  galleries: Gallery[];
  selectedGalleryId: string | null;
  onSelectGallery: (galleryId: string | null) => void;
  totalPictogramCount: number;
  isAuthenticated: boolean;
  onCreateGallery: () => void;
}

function SidebarContent({
  galleries,
  selectedGalleryId,
  onSelectGallery,
  totalPictogramCount,
  isAuthenticated,
  onCreateGallery,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-3">
        <h2 className="text-sm font-semibold">Galeries</h2>
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <button
          onClick={() => onSelectGallery(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
            selectedGalleryId === null
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Images className="size-4 shrink-0" />
          <span className="truncate">Tous les pictogrammes</span>
          <span className="ml-auto text-[0.625rem] tabular-nums text-muted-foreground">
            {totalPictogramCount}
          </span>
        </button>

        {galleries.length > 0 && <Separator className="my-2" />}

        {galleries.map((gallery) => (
          <button
            key={gallery.id}
            onClick={() => onSelectGallery(gallery.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
              selectedGalleryId === gallery.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {gallery.color ? (
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: gallery.color }}
              />
            ) : (
              <span className="size-3 shrink-0 rounded-full bg-muted-foreground/30" />
            )}
            <span className="truncate">{gallery.name}</span>
            <span className="ml-auto text-[0.625rem] tabular-nums text-muted-foreground">
              {gallery.pictogramIds.length}
            </span>
          </button>
        ))}
      </nav>

      {isAuthenticated && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={onCreateGallery}
            >
              <Plus className="size-3" />
              Nouvelle galerie
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectGallery = (galleryId: string | null) => {
    props.onSelectGallery(galleryId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="outline"
        size="icon-sm"
        className="fixed bottom-4 left-4 z-40 md:hidden shadow-md"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-4" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-xs font-medium">Navigation</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-3" />
          </Button>
        </div>
        <SidebarContent {...props} onSelectGallery={handleSelectGallery} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r bg-background">
        <SidebarContent {...props} />
      </aside>
    </>
  );
}
