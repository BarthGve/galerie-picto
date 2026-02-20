import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { PictogramsProvider, usePictogramsCtx } from "@/contexts/PictogramsContext";
import { GalleriesProvider, useGalleriesCtx } from "@/contexts/GalleriesContext";
import { useUserCollections } from "@/hooks/useUserCollections";
import { DownloadsContext, useDownloadsProvider } from "@/hooks/useDownloads";
import { useFavorites } from "@/hooks/useFavorites";
import { useLikes } from "@/hooks/useLikes";
import { useFeedbackNotifications } from "@/hooks/useFeedbackNotifications";
import { PictoGrid } from "@/components/PictoGrid";
import { AppSidebar } from "@/components/Sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  DEV_MODE,
  devLogin,
  initiateGitHubLogin,
  handleGitHubCallback,
  getGitHubUser,
  logout,
  getStoredToken,
  type GitHubUser,
} from "@/lib/github-auth";

const GalleryDialog = lazy(() =>
  import("@/components/GalleryDialog").then((m) => ({
    default: m.GalleryDialog,
  })),
);
const UploadDialog = lazy(() =>
  import("@/components/UploadDialog").then((m) => ({
    default: m.UploadDialog,
  })),
);
const HomePage = lazy(() =>
  import("@/components/HomePage").then((m) => ({
    default: m.HomePage,
  })),
);
const DiscoverPage = lazy(() =>
  import("@/components/DiscoverPage").then((m) => ({
    default: m.DiscoverPage,
  })),
);
const DiscoverShowcase = lazy(() =>
  import("@/components/DiscoverShowcase").then((m) => ({
    default: m.DiscoverShowcase,
  })),
);
const FeedbackPage = lazy(() =>
  import("@/components/FeedbackPage").then((m) => ({ default: m.FeedbackPage })),
);
type Page = "home" | "discover" | "gallery" | "test-discover" | "feedback";

function getInitialPage(): Page {
  const path = window.location.pathname;
  if (path === "/gallery") return "gallery";
  if (path === "/discover") return "discover";
  if (path === "/feedback") return "feedback";
  if (path === "/test-discover") return "test-discover";
  // OAuth callback → go straight to discover
  if (new URLSearchParams(window.location.search).has("code")) return "discover";
  return "home";
}

function AppInner() {
  const [page, setPage] = useState<Page>(getInitialPage);

  const {
    pictograms,
    loading,
    error,
    refetchPictograms,
    deletePictogram,
  } = usePictogramsCtx();
  const {
    galleries,
    galleriesLoading,
    createGallery,
    updateGallery,
    deleteGallery,
    addPictogramToGallery,
    removePictogramFromGallery,
    refetchGalleries,
  } = useGalleriesCtx();
  const downloadsValue = useDownloadsProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(
    null,
  );
  const [selectedContributor, setSelectedContributor] = useState<string | null>(
    null,
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedUserCollectionId, setSelectedUserCollectionId] = useState<string | null>(null);
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites(!!user);
  const { getLikeCount, hasLiked, toggleLike } = useLikes(!!user);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useFeedbackNotifications(!!user);
  const {
    collections: userCollections,
    create: createUserCollection,
    update: updateUserCollection,
    remove: removeUserCollection,
    addPictogram: addToUserCollection,
    removePictogram: removeFromUserCollection,
  } = useUserCollections(!!user);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === "/gallery") setPage("gallery");
      else if (path === "/discover") setPage("discover");
      else if (path === "/feedback") setPage("feedback");
      else setPage("home");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (target: Page) => {
    const path =
      target === "gallery"
        ? "/gallery"
        : target === "discover"
          ? "/discover"
          : target === "feedback"
            ? "/feedback"
            : target === "test-discover"
              ? "/test-discover"
              : "/";
    window.history.pushState(null, "", path);
    setPage(target);
    if (target === "discover" || target === "home") {
      setSelectedGalleryId(null);
      setSelectedContributor(null);
      setSelectedUserCollectionId(null);
      setShowFavoritesOnly(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSelectGallery = (id: string | null) => {
    setSelectedGalleryId(id);
    setSelectedUserCollectionId(null);
    setShowFavoritesOnly(false);
    setCurrentPage(1);
    if (page === "discover") navigateTo("gallery");
  };

  const handleSelectContributor = (contributor: string | null) => {
    setSelectedContributor(contributor);
    setSelectedUserCollectionId(null);
    setShowFavoritesOnly(false);
    setCurrentPage(1);
    if (page === "discover") navigateTo("gallery");
  };

  const handleSelectUserCollection = (id: string | null) => {
    setSelectedUserCollectionId(id);
    setSelectedGalleryId(null);
    setSelectedContributor(null);
    setShowFavoritesOnly(false);
    setCurrentPage(1);
    if (page === "discover") navigateTo("gallery");
  };
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<
    (typeof galleries)[number] | null
  >(null);
  const [galleryToDelete, setGalleryToDelete] = useState<
    (typeof galleries)[number] | null
  >(null);

  useEffect(() => {
    async function initAuth() {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.has("code")) {
          const token = await handleGitHubCallback();
          if (token) {
            const userInfo = await getGitHubUser(token);
            setUser(userInfo);
          }
        } else {
          const token = getStoredToken();
          if (token) {
            const userInfo = await getGitHubUser(token);
            setUser(userInfo);
          }
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        toast.error("Erreur d'authentification");
      } finally {
        setAuthLoading(false);
      }
    }

    initAuth();
  }, []);

  const handleLogin = () => {
    if (DEV_MODE) {
      const fakeUser = devLogin();
      setUser(fakeUser);
      navigateTo("discover");
      return;
    }
    initiateGitHubLogin();
  };

  const handleUploadSuccess = async () => {
    setUploadDialogOpen(false);
    toast.success("Pictogramme uploadé avec succès !");
    await Promise.all([refetchPictograms(), refetchGalleries()]);
  };

  const handleDeletePictogram = async (id: string): Promise<boolean> => {
    const success = await deletePictogram(id);
    if (success) {
      await refetchGalleries();
    }
    return success;
  };

  const handleDeleteGallery = (gallery: (typeof galleries)[number]) => {
    setGalleryToDelete(gallery);
  };

  const handleConfirmDeleteGallery = async () => {
    if (!galleryToDelete) return;
    const success = await deleteGallery(galleryToDelete.id);
    if (success) {
      toast.success(`Galerie « ${galleryToDelete.name} » supprimée`);
      if (selectedGalleryId === galleryToDelete.id) {
        setSelectedGalleryId(null);
      }
    }
    setGalleryToDelete(null);
  };

  const handleCreateGallery = () => {
    setEditingGallery(null);
    setGalleryDialogOpen(true);
  };

  const handleEditGallery = (gallery: (typeof galleries)[number]) => {
    setEditingGallery(gallery);
    setGalleryDialogOpen(true);
  };

  const handleSaveGallery = async (data: {
    name: string;
    description?: string;
    color?: string;
  }) => {
    if (editingGallery) {
      await updateGallery(editingGallery.id, data);
    } else {
      await createGallery(data);
    }
  };

  const filteredPictograms = useMemo(() => {
    let result = pictograms;

    if (showFavoritesOnly) {
      result = result.filter((picto) => isFavorite(picto.id));
    }

    if (selectedGalleryId) {
      const gallery = galleries.find((g) => g.id === selectedGalleryId);
      if (gallery) {
        const pictoIdsInGallery = new Set(gallery.pictogramIds);
        result = result.filter((picto) => pictoIdsInGallery.has(picto.id));
      }
    }

    if (selectedUserCollectionId) {
      const col = userCollections.find((c) => c.id === selectedUserCollectionId);
      if (col) {
        const ids = new Set(col.pictogramIds);
        result = result.filter((picto) => ids.has(picto.id));
      }
    }

    if (selectedContributor) {
      result = result.filter(
        (picto) => picto.contributor?.githubUsername === selectedContributor,
      );
    }

    if (searchQuery) {
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const query = normalize(searchQuery);
      result = result.filter(
        (picto) =>
          normalize(picto.name).includes(query) ||
          normalize(picto.id).includes(query) ||
          normalize(picto.filename).includes(query) ||
          picto.tags?.some((tag) => normalize(tag).includes(query)) ||
          (picto.contributor &&
            normalize(picto.contributor.githubUsername).includes(query)),
      );
    }

    return result;
  }, [
    pictograms,
    searchQuery,
    selectedGalleryId,
    selectedContributor,
    showFavoritesOnly,
    isFavorite,
    galleries,
    selectedUserCollectionId,
    userCollections,
  ]);

  // Home page — rendered before gallery data is needed
  if (page === "home") {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }
      >
        <HomePage
          onEnterGallery={() => navigateTo("discover")}
          user={user}
          onLogin={handleLogin}
          onLogout={logout}
        />
      </Suspense>
    );
  }

  // Test Discover Showcase page
  if (page === "test-discover") {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }
      >
        <DiscoverShowcase />
      </Suspense>
    );
  }

  // Discover / Gallery pages (both need data loaded)
  if (loading || authLoading || galleriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Chargement des pictogrammes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <DownloadsContext.Provider value={downloadsValue}>
    <TooltipProvider>
      <div className="relative">
        {/* ── Background orbs + dot grid (Proposition B) ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-[10%] -right-[5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-[#fddede] to-[#c83f49] blur-3xl opacity-8 animate-pulse"
            style={{ animationDuration: "15s" }}
          />
          <div
            className="absolute -bottom-[10%] -left-[5%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-[#e3e3fd] to-[#6a6af4] blur-3xl opacity-8 animate-pulse"
            style={{ animationDuration: "20s" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
        </div>

      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          variant="sidebar"
          galleries={galleries}
          pictograms={pictograms}
          selectedGalleryId={selectedGalleryId}
          selectedContributor={selectedContributor}
          onSelectGallery={handleSelectGallery}
          onSelectContributor={handleSelectContributor}
          totalPictogramCount={pictograms.length}
          user={user}
          onLogin={handleLogin}
          onLogout={logout}
          onUploadClick={() => setUploadDialogOpen(true)}
          onCreateGallery={handleCreateGallery}
          onEditGallery={handleEditGallery}
          onDeleteGallery={handleDeleteGallery}
          onAddToGallery={addPictogramToGallery}
          onGoHome={() => navigateTo("home")}
          onGoDiscover={() => navigateTo("discover")}
          onGoFeedback={() => navigateTo("feedback")}
          currentPage={page}
          favoritesCount={favoritesCount}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={() => {
            setShowFavoritesOnly((prev) => !prev);
            setSelectedUserCollectionId(null);
            setCurrentPage(1);
            if (page === "discover") navigateTo("gallery");
          }}
          userCollections={userCollections}
          selectedUserCollectionId={selectedUserCollectionId}
          onSelectUserCollection={handleSelectUserCollection}
          onCreateUserCollection={createUserCollection}
          onUpdateUserCollection={updateUserCollection}
          onRemoveUserCollection={removeUserCollection}
          onAddToUserCollection={addToUserCollection}
        />

        <SidebarInset>
          <SiteHeader
            onSearch={(q) => {
              handleSearchChange(q);
              if (page === "discover") navigateTo("gallery");
            }}
            totalCount={pictograms.length}
            isAuthenticated={!!user}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
            onGoFeedback={() => navigateTo("feedback")}
          />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {page === "feedback" ? (
                <Suspense fallback={null}>
                  <FeedbackPage user={user} onLogin={handleLogin} />
                </Suspense>
              ) : page === "discover" ? (
                <Suspense fallback={null}>
                  <DiscoverPage
                    pictograms={pictograms}
                    galleries={galleries}
                    onNavigateGallery={(opts) => {
                      if (opts?.galleryId) {
                        handleSelectGallery(opts.galleryId);
                      }
                      if (opts?.search) {
                        handleSearchChange(opts.search);
                      }
                      navigateTo("gallery");
                    }}
                    isAuthenticated={!!user}
                    user={user}
                    onPictogramUpdated={refetchPictograms}
                    onAddToGallery={addPictogramToGallery}
                    onRemoveFromGallery={removePictogramFromGallery}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    onLogin={handleLogin}
                    getLikeCount={getLikeCount}
                    hasLiked={hasLiked}
                    onToggleLike={user ? toggleLike : undefined}
                  />
                </Suspense>
              ) : (
                <div className="flex-1 overflow-y-auto pb-12">
                  {/* En-tête de galerie équipe */}
                  {selectedGalleryId && (() => {
                    const gal = galleries.find(g => g.id === selectedGalleryId);
                    if (!gal) return null;
                    return (
                      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: gal.color ?? "var(--muted-foreground)", opacity: gal.color ? 1 : 0.4 }}
                          />
                          <h2 className="font-extrabold text-lg text-foreground leading-tight">{gal.name}</h2>
                          <span className="text-xs text-muted-foreground font-medium">{gal.pictogramIds.length} picto{gal.pictogramIds.length !== 1 ? "s" : ""}</span>
                        </div>
                        {gal.description && (
                          <p className="text-sm text-muted-foreground pl-6">{gal.description}</p>
                        )}
                      </div>
                    );
                  })()}
                  {/* En-tête de collection utilisateur */}
                  {selectedUserCollectionId && (() => {
                    const col = userCollections.find(c => c.id === selectedUserCollectionId);
                    if (!col) return null;
                    return (
                      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: col.color ?? "var(--muted-foreground)", opacity: col.color ? 1 : 0.4 }}
                          />
                          <h2 className="font-extrabold text-lg text-foreground leading-tight">{col.name}</h2>
                          <span className="text-xs text-muted-foreground font-medium">{col.pictogramIds.length} picto{col.pictogramIds.length !== 1 ? "s" : ""}</span>
                        </div>
                        {col.description && (
                          <p className="text-sm text-muted-foreground pl-6">{col.description}</p>
                        )}
                      </div>
                    );
                  })()}
                  <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
                    <PictoGrid
                      pictograms={filteredPictograms}
                      galleries={galleries}
                      onAddToGallery={addPictogramToGallery}
                      onRemoveFromGallery={removePictogramFromGallery}
                      isAuthenticated={!!user}
                      user={user}
                      selectedGalleryId={selectedGalleryId}
                      onPictogramUpdated={refetchPictograms}
                      onDeletePictogram={
                        user ? handleDeletePictogram : undefined
                      }
                      page={currentPage}
                      onPageChange={setCurrentPage}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                      onLogin={handleLogin}
                      userCollections={user ? userCollections : undefined}
                      onAddToUserCollection={user ? addToUserCollection : undefined}
                      onRemoveFromUserCollection={user ? removeFromUserCollection : undefined}
                      getLikeCount={getLikeCount}
                      hasLiked={hasLiked}
                      onToggleLike={user ? toggleLike : undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>

        {uploadDialogOpen && (
          <Suspense fallback={null}>
            <UploadDialog
              onUploadSuccess={handleUploadSuccess}
              open={uploadDialogOpen}
              onOpenChange={setUploadDialogOpen}
              user={user}
            />
          </Suspense>
        )}

        {galleryDialogOpen && (
          <Suspense fallback={null}>
            <GalleryDialog
              open={galleryDialogOpen}
              onOpenChange={setGalleryDialogOpen}
              gallery={editingGallery}
              onSave={handleSaveGallery}
            />
          </Suspense>
        )}

        <DeleteConfirmDialog
          open={!!galleryToDelete}
          onOpenChange={(open) => { if (!open) setGalleryToDelete(null); }}
          onConfirm={handleConfirmDeleteGallery}
          title="Supprimer cette galerie ?"
          description={<>La galerie <span className="font-semibold">« {galleryToDelete?.name} »</span> sera supprimée définitivement. Les pictogrammes qu'elle contient ne seront pas supprimés.</>}
        />
      </SidebarProvider>
      </div>
    </TooltipProvider>
    </DownloadsContext.Provider>
  );
}

function App() {
  return (
    <PictogramsProvider>
      <GalleriesProvider>
        <AppInner />
      </GalleriesProvider>
    </PictogramsProvider>
  );
}

export default App;
