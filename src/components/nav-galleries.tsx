import { useState } from "react";
import { CirclePlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Gallery } from "@/lib/types";
import { toast } from "sonner";

export function NavGalleries({
  galleries,
  selectedGalleryId,
  onSelectGallery,
  onEditGallery,
  onDeleteGallery,
  onAddToGallery,
  onCreateGallery,
}: {
  galleries: Gallery[];
  selectedGalleryId: string | null;
  onSelectGallery: (id: string) => void;
  onEditGallery?: (gallery: Gallery) => void;
  onDeleteGallery?: (gallery: Gallery) => void;
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onCreateGallery?: () => void;
}) {
  const { isMobile } = useSidebar();
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (galleries.length === 0) return null;

  const handleDragOver = (e: React.DragEvent, galleryId: string) => {
    if (e.dataTransfer.types.includes("application/pictogram-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOverId(galleryId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, gallery: Gallery) => {
    e.preventDefault();
    setDragOverId(null);
    const pictogramId = e.dataTransfer.getData("application/pictogram-id");
    if (!pictogramId || !onAddToGallery) return;

    if (gallery.pictogramIds.includes(pictogramId)) {
      toast.info(`Déjà dans « ${gallery.name} »`);
      return;
    }

    const ok = await onAddToGallery(gallery.id, pictogramId);
    if (ok) {
      toast.success(`Ajouté à « ${gallery.name} »`);
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="px-3 mb-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Galeries</span>
        {onCreateGallery && (
          <button
            onClick={onCreateGallery}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Nouvelle galerie"
          >
            <CirclePlus className="size-3.5" />
          </button>
        )}
      </div>
      <SidebarMenu>
        {galleries.map((gallery) => (
          <SidebarMenuItem key={gallery.id}>
            <SidebarMenuButton
              isActive={selectedGalleryId === gallery.id}
              onClick={() => onSelectGallery(gallery.id)}
              tooltip={gallery.name}
              onDragOver={(e) => handleDragOver(e, gallery.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, gallery)}
              className={
                dragOverId === gallery.id
                  ? "ring-2 ring-primary bg-primary/10"
                  : ""
              }
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: gallery.color || "var(--muted-foreground)",
                  opacity: gallery.color ? 1 : 0.3,
                }}
              />
              <span className="text-sm font-bold">{gallery.name}</span>
            </SidebarMenuButton>
            {(onEditGallery || onDeleteGallery) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="data-[state=open]:bg-accent rounded-[4px]"
                  >
                    <MoreHorizontal />
                    <span className="sr-only">Plus</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-36 rounded-[4px] border-border"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  {onEditGallery && (
                    <DropdownMenuItem className="rounded-[4px]" onClick={() => onEditGallery(gallery)}>
                      <Pencil />
                      <span>Modifier</span>
                    </DropdownMenuItem>
                  )}
                  {onEditGallery && onDeleteGallery && (
                    <DropdownMenuSeparator />
                  )}
                  {onDeleteGallery && (
                    <DropdownMenuItem
                      className="rounded-[4px]"
                      variant="destructive"
                      onClick={() => onDeleteGallery(gallery)}
                    >
                      <Trash2 />
                      <span>Supprimer</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
