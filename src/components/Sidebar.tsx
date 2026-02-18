import { Moon, Palette, Plus, Sun } from "lucide-react";

import { NavGalleries } from "@/components/nav-galleries";
import { NavContributors } from "@/components/nav-contributors";
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
import type { Gallery, Pictogram } from "@/lib/types";
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
  pictograms,
  selectedGalleryId,
  selectedContributor,
  onSelectGallery,
  onSelectContributor,
  totalPictogramCount,
  user,
  onLogin,
  onLogout,
  onUploadClick,
  onCreateGallery,
  onEditGallery,
  onDeleteGallery,
  onAddToGallery,
  onGoHome,
  onGoDiscover,
  currentPage,
  favoritesCount,
  showFavoritesOnly,
  onToggleFavorites,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  galleries: Gallery[];
  pictograms: Pictogram[];
  selectedGalleryId: string | null;
  selectedContributor: string | null;
  onSelectGallery: (galleryId: string | null) => void;
  onSelectContributor: (login: string | null) => void;
  totalPictogramCount: number;
  user: GitHubUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onUploadClick: () => void;
  onCreateGallery: () => void;
  onEditGallery?: (gallery: Gallery) => void;
  onDeleteGallery?: (gallery: Gallery) => void;
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onGoHome?: () => void;
  onGoDiscover?: () => void;
  currentPage?: string;
  favoritesCount?: number;
  showFavoritesOnly?: boolean;
  onToggleFavorites?: () => void;
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-accent/60"
            >
              <a
                href="/"
                onClick={(e) => {
                  if (onGoHome) {
                    e.preventDefault();
                    onGoHome();
                  }
                }}
              >
                <div className="flex items-center justify-center size-7 rounded-lg bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-600 shadow-sm">
                  <Palette className="!size-4 text-white" />
                </div>
                <span className="text-base font-bold text-gradient-primary">Galerie Picto</span>
                <span className="text-muted-foreground/60 ml-auto text-[10px] font-medium">
                  v{__APP_VERSION__}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pt-8 [&>*+*]:mt-3">
        <NavMain
          totalPictogramCount={totalPictogramCount}
          selectedGalleryId={selectedGalleryId}
          onSelectAll={() => {
            onSelectGallery(null);
            onSelectContributor(null);
          }}
          isAuthenticated={!!user}
          onUploadClick={onUploadClick}
          onGoDiscover={onGoDiscover}
          currentPage={currentPage}
          favoritesCount={favoritesCount}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={onToggleFavorites}
        />
        <NavGalleries
          galleries={galleries}
          selectedGalleryId={selectedGalleryId}
          onSelectGallery={(id) => {
            onSelectGallery(id);
            onSelectContributor(null);
          }}
          onEditGallery={user ? onEditGallery : undefined}
          onDeleteGallery={user ? onDeleteGallery : undefined}
          onAddToGallery={user ? onAddToGallery : undefined}
        />
        <NavContributors
          pictograms={pictograms}
          selectedContributor={selectedContributor}
          onSelectContributor={(login) => {
            onSelectContributor(login);
            if (login) onSelectGallery(null);
          }}
        />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {!!user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onCreateGallery}
                    className="text-muted-foreground hover:text-primary hover:bg-accent/60"
                  >
                    <Plus className="size-4" />
                    <span>Nouvelle collection</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarMenu>
          <ThemeToggleItem />
        </SidebarMenu>
        <NavUser user={user} onLogin={onLogin} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
