import { Images, CirclePlus, Compass, Heart, BookOpen, MessageSquarePlus } from "lucide-react";

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
  onGoGuides,
  onGoRequests,
  activeRequestCount = 0,
  isCollaborator,
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
  onGoGuides?: () => void;
  onGoRequests?: () => void;
  activeRequestCount?: number;
  isCollaborator?: boolean;
  currentPage?: string;
  favoritesCount?: number;
  showFavoritesOnly?: boolean;
  onToggleFavorites?: () => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu className={isCollaborator ? "gap-4" : ""}>
          {isAuthenticated && (
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
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Demander un pictogramme"
              onClick={onGoRequests}
              isActive={currentPage === "requests"}
              className="bg-indigo-50 text-indigo-700 shadow-sm rounded hover:bg-indigo-100 hover:text-indigo-800 active:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
            >
              <MessageSquarePlus />
              <span>Demander un picto</span>
            </SidebarMenuButton>
            {activeRequestCount > 0 && (
              <SidebarMenuBadge className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 peer-hover/menu-button:bg-transparent">
                {activeRequestCount}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        </SidebarMenu>

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
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentPage === "guides"}
              onClick={onGoGuides}
              tooltip="Guides"
            >
              <BookOpen />
              <span>Guides</span>
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
