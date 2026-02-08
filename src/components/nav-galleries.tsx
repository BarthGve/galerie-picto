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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Gallery } from "@/lib/types";

export function NavGalleries({
  galleries,
  selectedGalleryId,
  onSelectGallery,
  onEditGallery,
  onDeleteGallery,
}: {
  galleries: Gallery[];
  selectedGalleryId: string | null;
  onSelectGallery: (id: string) => void;
  onEditGallery?: (gallery: Gallery) => void;
  onDeleteGallery?: (gallery: Gallery) => void;
}) {
  const { isMobile } = useSidebar();

  if (galleries.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Collections</SidebarGroupLabel>
      <SidebarMenu>
        {galleries.map((gallery) => (
          <SidebarMenuItem key={gallery.id}>
            <SidebarMenuButton
              isActive={selectedGalleryId === gallery.id}
              onClick={() => onSelectGallery(gallery.id)}
              tooltip={gallery.name}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: gallery.color || "var(--muted-foreground)",
                  opacity: gallery.color ? 1 : 0.3,
                }}
              />
              <span>{gallery.name}</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>{gallery.pictogramIds.length}</SidebarMenuBadge>
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
                  className="w-36 rounded-lg"
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
