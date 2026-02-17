import { Images, CirclePlus, Compass } from "lucide-react";

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
}: {
  totalPictogramCount: number;
  selectedGalleryId: string | null;
  onSelectAll: () => void;
  isAuthenticated: boolean;
  onUploadClick: () => void;
  onGoDiscover?: () => void;
  currentPage?: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {isAuthenticated && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Ajouter un pictogramme"
                onClick={onUploadClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <CirclePlus />
                <span>Ajouter</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
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
              isActive={currentPage === "gallery" && selectedGalleryId === null}
              onClick={onSelectAll}
              tooltip="Tous les pictogrammes"
            >
              <Images />
              <span>Tous les pictogrammes</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>{totalPictogramCount}</SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
