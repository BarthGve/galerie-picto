import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { usePictograms } from "@/hooks/usePictograms";
import { useGalleries } from "@/hooks/useGalleries";
import { DownloadsContext, useDownloadsProvider } from "@/hooks/useDownloads";
import { useFavorites } from "@/hooks/useFavorites";
import { PictoGrid } from "@/components/PictoGrid";
import { AppSidebar } from "@/components/Sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
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
type Page = "home" | "discover" | "gallery" | "test-discover";

function getInitialPage(): Page {
  const path = window.location.pathname;
  if (path === "/gallery") return "gallery";
  if (path === "/discover") return "discover";
  if (path === "/test-discover") return "test-discover";
  // OAuth callback → go straight to gallery
  if (new URLSearchParams(window.location.search).has("code")) return "gallery";
  return "home";
}

function App() {
  const [page, setPage] = useState<Page>(getInitialPage);

  const {
    pictograms,
    loading,
    error,
    lastUpdated,
    refetch: refetchPictograms,
    deletePictogram,
  } = usePictograms();
  const {
    galleries,
    loading: galleriesLoading,
    createGallery,
    updateGallery,
    deleteGallery,
    addPictogramToGallery,
    removePictogramFromGallery,
    refetch: refetchGalleries,
  } = useGalleries();
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
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites(!!user);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === "/gallery") setPage("gallery");
      else if (path === "/discover") setPage("discover");
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
          : target === "test-discover"
            ? "/test-discover"
            : "/";
    window.history.pushState(null, "", path);
    setPage(target);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSelectGallery = (id: string | null) => {
    setSelectedGalleryId(id);
    setCurrentPage(1);
    if (page === "discover") navigateTo("gallery");
  };

  const handleSelectContributor = (contributor: string | null) => {
    setSelectedContributor(contributor);
    setCurrentPage(1);
    if (page === "discover") navigateTo("gallery");
  };
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<
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
    // Check directly — no reliance on cached module constants
    if (!import.meta.env.VITE_GITHUB_CLIENT_ID) {
      console.log("[DEV] Fake login activated — no VITE_GITHUB_CLIENT_ID");
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

  const handleDeleteGallery = async (gallery: (typeof galleries)[number]) => {
    const confirmed = window.confirm(
      `Supprimer la collection « ${gallery.name} » ? Les pictogrammes ne seront pas supprimés.`,
    );
    if (!confirmed) return;
    const success = await deleteGallery(gallery.id);
    if (success) {
      toast.success(`Collection « ${gallery.name} » supprimée`);
      if (selectedGalleryId === gallery.id) {
        setSelectedGalleryId(null);
      }
    }
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
        result = result.filter(
          (picto) =>
            pictoIdsInGallery.has(picto.id) ||
            picto.galleryIds?.includes(selectedGalleryId),
        );
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
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
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
          currentPage={page}
          favoritesCount={favoritesCount}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={() => {
            setShowFavoritesOnly((prev) => !prev);
            setCurrentPage(1);
            if (page === "discover") navigateTo("gallery");
          }}
        />

        <SidebarInset>
          <SiteHeader
            onSearch={(q) => {
              handleSearchChange(q);
              if (page === "discover") navigateTo("gallery");
            }}
            totalCount={pictograms.length}
            filteredCount={filteredPictograms.length}
          />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {page === "discover" ? (
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
                  />
                </Suspense>
              ) : (
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
                    {lastUpdated && (
                      <p className="text-[11px] text-muted-foreground mb-6 font-medium">
                        Dernière mise à jour :{" "}
                        {new Date(lastUpdated).toLocaleString("fr-FR")}
                      </p>
                    )}
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
      </SidebarProvider>
    </TooltipProvider>
    </DownloadsContext.Provider>
  );
}

export default App;
