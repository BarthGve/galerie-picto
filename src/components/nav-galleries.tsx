import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

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
  SidebarMenuBadge,
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
}: {
  galleries: Gallery[];
  selectedGalleryId: string | null;
  onSelectGallery: (id: string) => void;
  onEditGallery?: (gallery: Gallery) => void;
  onDeleteGallery?: (gallery: Gallery) => void;
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
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
      <div className="px-3 mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collections</span>
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
            <SidebarMenuBadge className="group-hover/menu-item:opacity-0 transition-opacity text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent text-muted-foreground">
              {gallery.pictogramIds.length}
            </SidebarMenuBadge>
            {(onEditGallery || onDeleteGallery) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="data-[state=open]:bg-accent rounded-sm"
                  >
                    <MoreHorizontal />
                    <span className="sr-only">Plus</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-36 rounded-xl border-border"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  {onEditGallery && (
                    <DropdownMenuItem onClick={() => onEditGallery(gallery)}>
                      <Pencil />
                      <span>Modifier</span>
                    </DropdownMenuItem>
                  )}
                  {onEditGallery && onDeleteGallery && (
                    <DropdownMenuSeparator />
                  )}
                  {onDeleteGallery && (
                    <DropdownMenuItem
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
