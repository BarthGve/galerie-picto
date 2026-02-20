import { Images, CirclePlus, Compass, Heart } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  totalPictogramCount,
  selectedGalleryId,
  selectedContributor,
  selectedUserCollectionId,
  onSelectAll,
  isAuthenticated,
  onUploadClick,
  onGoDiscover,
  currentPage,
  favoritesCount,
  showFavoritesOnly,
  onToggleFavorites,
}: {
  totalPictogramCount: number;
  selectedGalleryId: string | null;
  selectedContributor?: string | null;
  selectedUserCollectionId?: string | null;
  onSelectAll: () => void;
  isAuthenticated: boolean;
  onUploadClick: () => void;
  onGoDiscover?: () => void;
  currentPage?: string;
  favoritesCount?: number;
  showFavoritesOnly?: boolean;
  onToggleFavorites?: () => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        {isAuthenticated && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Ajouter un pictogramme"
                onClick={onUploadClick}
                className="bg-primary text-primary-foreground shadow-lg rounded hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/80 active:text-primary-foreground"
              >
                <CirclePlus />
                <span>Ajouter</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <div className="h-4" />

        {/* Label section */}
        <div className="px-3 mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Navigation</span>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentPage === "discover"}
              onClick={onGoDiscover}
              tooltip="Découvrir"
            >
              <Compass />
              <span>Découvrir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentPage === "gallery" && !selectedGalleryId && !selectedContributor && !showFavoritesOnly && !selectedUserCollectionId}
              onClick={onSelectAll}
              tooltip="Tous les pictogrammes"
            >
              <Images />
              <span>Tous les pictos</span>
            </SidebarMenuButton>
            <SidebarMenuBadge className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent peer-hover/menu-button:bg-transparent">
              {totalPictogramCount}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>

        {isAuthenticated && onToggleFavorites && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={showFavoritesOnly}
                onClick={onToggleFavorites}
                tooltip="Mes favoris"
              >
                <Heart
                  className="transition-colors"
                  style={showFavoritesOnly ? {
                    color: "var(--destructive)",
                    fill: "var(--destructive)",
                  } : {}}
                />
                <span>Mes favoris</span>
              </SidebarMenuButton>
              {(favoritesCount ?? 0) > 0 && (
                <SidebarMenuBadge className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent peer-hover/menu-button:bg-transparent">
                  {favoritesCount}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
