import { Palette, Plus, Github, ArrowRight, MessageCircleWarning, LayoutList, LayoutDashboard } from "lucide-react";

import { NavGalleries } from "@/components/nav-galleries";
import { NavContributors } from "@/components/nav-contributors";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { NavUserCollections } from "@/components/NavUserCollections";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Gallery, Pictogram, UserCollection } from "@/lib/types";
import type { GitHubUser } from "@/lib/github-auth";

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
  userCollections,
  selectedUserCollectionId,
  onSelectUserCollection,
  onCreateUserCollection,
  onUpdateUserCollection,
  onRemoveUserCollection,
  onAddToUserCollection,
  onGoFeedback,
  onGoProfile,
  onGoAdmin,
  isCollaborator = false,
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
  userCollections?: UserCollection[];
  selectedUserCollectionId?: string | null;
  onSelectUserCollection?: (id: string | null) => void;
  onCreateUserCollection?: (name: string, color?: string) => Promise<UserCollection | null>;
  onUpdateUserCollection?: (id: string, data: { name?: string; color?: string | null }) => Promise<void>;
  onRemoveUserCollection?: (id: string) => Promise<void>;
  onAddToUserCollection?: (collectionId: string, pictogramId: string) => Promise<boolean>;
  onGoFeedback?: () => void;
  onGoProfile?: () => void;
  onGoAdmin?: () => void;
  isCollaborator?: boolean;
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* ── Header : Logo compact style B ── */}
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
                <div className="flex items-center justify-center size-8 rounded-xl bg-foreground shadow-lg">
                  <Palette className="!size-5 text-background" />
                </div>
                <span className="text-xl font-black tracking-tighter">La Boite à Pictos</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="pt-6 [&>*+*]:mt-6">
        <NavMain
          totalPictogramCount={totalPictogramCount}
          selectedGalleryId={selectedGalleryId}
          selectedContributor={selectedContributor}
          selectedUserCollectionId={selectedUserCollectionId}
          onSelectAll={() => {
            onSelectGallery(null);
            onSelectContributor(null);
            onSelectUserCollection?.(null);
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
        {!!user && (
          <NavUserCollections
            collections={userCollections ?? []}
            selectedCollectionId={selectedUserCollectionId ?? null}
            onSelectCollection={(id) => onSelectUserCollection?.(id)}
            onCreate={onCreateUserCollection ?? (async () => null)}
            onUpdate={onUpdateUserCollection ?? (async () => {})}
            onRemove={onRemoveUserCollection ?? (async () => {})}
            onAddPictogram={onAddToUserCollection ?? (async () => false)}
          />
        )}

        <NavContributors
          pictograms={pictograms}
          selectedContributor={selectedContributor}
          onSelectContributor={(login) => {
            onSelectContributor(login);
            if (login) onSelectGallery(null);
          }}
        />

        {/* Nouvelle galerie — style dashed B */}
        {!!user && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onCreateGallery}
                    className="border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded"
                  >
                    <Plus className="size-4" />
                    <span>Nouvelle galerie</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ── GitHub Bonus Card (non-connecté) ── */}
        {!user && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-auto">
            <div className="relative p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-background border border-primary/25 shadow-lg overflow-hidden group mb-6">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Github className="w-16 h-16 rotate-12" />
              </div>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <Github className="w-4 h-4" />
                  Bonus GitHub
                </div>
                <p className="text-muted-foreground text-[11px] font-medium leading-relaxed">
                  Connectez-vous pour débloquer <span className="text-primary">favoris</span> et <span className="text-primary">collections</span>.
                </p>
                <button
                  onClick={onLogin}
                  className="text-[11px] font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Se connecter <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer : Signaler + user ── */}
      <SidebarFooter>
        <SidebarMenu>
          {isCollaborator && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onGoAdmin?.()}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/60"
              >
                <LayoutDashboard className="size-4" />
                <span>Administration</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onGoFeedback}
              className="text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              {!!user ? (
                <MessageCircleWarning className="size-4" />
              ) : (
                <LayoutList className="size-4" />
              )}
              <span>{!!user ? "Signaler" : "Signalements"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="mx-0 w-full" />
        <div className="flex items-center px-2 py-1">
          <NavUser user={user} onLogin={onLogin} onLogout={onLogout} onGoProfile={onGoProfile ?? (() => {})} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
