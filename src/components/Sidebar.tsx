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
              <a
                href="/"
                onClick={(e) => {
                  if (onGoHome) {
                    e.preventDefault();
                    onGoHome();
                  }
                }}
              >
                <Palette className="!size-5 text-primary" />
                <span className="text-base font-semibold">Galerie Picto</span>
                <span className="text-muted-foreground ml-auto text-[10px]">
                  v{__APP_VERSION__}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          totalPictogramCount={totalPictogramCount}
          selectedGalleryId={selectedGalleryId}
          onSelectAll={() => {
            onSelectGallery(null);
            onSelectContributor(null);
          }}
          isAuthenticated={!!user}
          onUploadClick={onUploadClick}
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
