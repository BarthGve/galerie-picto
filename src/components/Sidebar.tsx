import { Moon, Palette, Plus, Sun } from "lucide-react";

import { NavGalleries } from "@/components/nav-galleries";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import type { Gallery } from "@/lib/types";
import type { GitHubUser } from "@/lib/github-auth";
import { useTheme } from "@/hooks/use-theme";

function ThemeToggleItem() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setTheme(isDark ? "light" : "dark")}
        tooltip={isDark ? "Mode clair" : "Mode sombre"}
      >
        {isDark ? <Sun /> : <Moon />}
        <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  galleries,
  selectedGalleryId,
  onSelectGallery,
  totalPictogramCount,
  user,
  onLogin,
  onLogout,
  onUploadClick,
  onCreateGallery,
  onEditGallery,
  onDeleteGallery,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  galleries: Gallery[];
  selectedGalleryId: string | null;
  onSelectGallery: (galleryId: string | null) => void;
  totalPictogramCount: number;
  user: GitHubUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onUploadClick: () => void;
  onCreateGallery: () => void;
  onEditGallery?: (gallery: Gallery) => void;
  onDeleteGallery?: (gallery: Gallery) => void;
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Palette className="!size-5" />
                <span className="text-base font-semibold">Galerie Picto</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          totalPictogramCount={totalPictogramCount}
          selectedGalleryId={selectedGalleryId}
          onSelectAll={() => onSelectGallery(null)}
          isAuthenticated={!!user}
          onUploadClick={onUploadClick}
        />
        <NavGalleries
          galleries={galleries}
          selectedGalleryId={selectedGalleryId}
          onSelectGallery={onSelectGallery}
          onEditGallery={user ? onEditGallery : undefined}
          onDeleteGallery={user ? onDeleteGallery : undefined}
        />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {!!user && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onCreateGallery}>
                    <Plus />
                    <span>Nouvelle collection</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <ThemeToggleItem />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogin={onLogin} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
