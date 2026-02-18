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
        {/* Label section */}
        <div className="px-3 mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Navigation</span>
        </div>

        {isAuthenticated && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Ajouter un pictogramme"
                onClick={onUploadClick}
                className="bg-foreground text-background hover:opacity-90 hover:text-background active:opacity-90 active:text-background shadow-lg rounded-xl"
              >
                <CirclePlus />
                <span>Ajouter</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

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
              isActive={currentPage === "gallery" && !selectedGalleryId && !showFavoritesOnly}
              onClick={onSelectAll}
              tooltip="Tous les pictogrammes"
            >
              <Images />
              <span>Tous les pictos</span>
            </SidebarMenuButton>
            <SidebarMenuBadge className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent text-muted-foreground">
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
                <Heart className={showFavoritesOnly ? "fill-current text-red-500" : ""} />
                <span>Mes favoris</span>
              </SidebarMenuButton>
              {(favoritesCount ?? 0) > 0 && (
                <SidebarMenuBadge className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent text-muted-foreground">
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
