import { Images, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Gallery } from "@/lib/types";

interface AppSidebarProps {
  galleries: Gallery[];
  selectedGalleryId: string | null;
  onSelectGallery: (galleryId: string | null) => void;
  totalPictogramCount: number;
  isAuthenticated: boolean;
  onCreateGallery: () => void;
}

export function AppSidebar({
  galleries,
  selectedGalleryId,
  onSelectGallery,
  totalPictogramCount,
  isAuthenticated,
  onCreateGallery,
}: AppSidebarProps) {
  return (
    <ShadcnSidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Galeries</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={selectedGalleryId === null}
                onClick={() => onSelectGallery(null)}
                tooltip="Tous les pictogrammes"
              >
                <Images className="size-4" />
                <span>Tous les pictogrammes</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>{totalPictogramCount}</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {galleries.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Collections</SidebarGroupLabel>
              <SidebarMenu>
                {galleries.map((gallery) => (
                  <SidebarMenuItem key={gallery.id}>
                    <SidebarMenuButton
                      isActive={selectedGalleryId === gallery.id}
                      onClick={() => onSelectGallery(gallery.id)}
                      tooltip={gallery.name}
                    >
                      {gallery.color ? (
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: gallery.color }}
                        />
                      ) : (
                        <span className="size-3 shrink-0 rounded-full bg-muted-foreground/30" />
                      )}
                      <span>{gallery.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>
                      {gallery.pictogramIds.length}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {isAuthenticated && (
        <SidebarFooter>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={onCreateGallery}
          >
            <Plus className="size-4" />
            Nouvelle galerie
          </Button>
        </SidebarFooter>
      )}
    </ShadcnSidebar>
  );
}
