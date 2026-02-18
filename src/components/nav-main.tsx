import { Images, CirclePlus, Compass, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        {isAuthenticated && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Ajouter un pictogramme"
                onClick={onUploadClick}
                className="bg-gradient-to-r from-rose-500 via-fuchsia-600 to-indigo-600 text-white hover:opacity-90 hover:text-white active:opacity-90 active:text-white min-w-8 duration-200 ease-linear shadow-sm"
              >
                <CirclePlus />
                <span>Ajouter</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0 rounded-lg border-border"
                variant="outline"
                onClick={onSelectAll}
              >
                <Images />
                <span className="sr-only">Tous</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentPage === "discover"}
              onClick={onGoDiscover}
              tooltip="Accueil"
            >
              <Compass />
              <span>Accueil</span>
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
              <span>Tous les pictogrammes</span>
            </SidebarMenuButton>
            <SidebarMenuBadge className="bg-badge-accent-bg text-badge-accent-text border border-badge-accent-border text-[10px] rounded-full px-1.5">
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
                <SidebarMenuBadge className="bg-badge-download-bg text-badge-download-text border border-badge-download-border text-[10px] rounded-full px-1.5">
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
