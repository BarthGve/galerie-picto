import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PictogramsProvider, usePictogramsCtx } from "@/contexts/PictogramsContext";
import { GalleriesProvider, useGalleriesCtx } from "@/contexts/GalleriesContext";
import { useUserCollections } from "@/hooks/useUserCollections";
import { useUserPictograms } from "@/hooks/useUserPictograms";
import { DownloadsContext, useDownloadsProvider } from "@/hooks/useDownloads";
import { useFavorites } from "@/hooks/useFavorites";
import { useLikes } from "@/hooks/useLikes";
import { useFeedbackNotifications } from "@/hooks/useFeedbackNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { useActiveRequestCount } from "@/hooks/useActiveRequestCount";
import { PictoGrid } from "@/components/PictoGrid";
import { UserPictoUploadDialog } from "@/components/UserPictoUploadDialog";
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
  getIsCollaboratorFromToken,
  type GitHubUser,
} from "@/lib/github-auth";
import { API_URL } from "@/lib/config";

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
  import("@/components/HomePageV3").then((m) => ({
    default: m.HomePageV3,
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
const PrivacyPage = lazy(() =>
  import("@/components/PrivacyPage").then((m) => ({ default: m.PrivacyPage })),
);
const ProfilePage = lazy(() =>
  import("@/components/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const CookiesPage = lazy(() =>
  import("@/components/CookiesPage").then((m) => ({ default: m.CookiesPage })),
);
const AdminPage = lazy(() =>
  import("@/components/AdminPage").then((m) => ({ default: m.AdminPage })),
);
const CollectionsPage = lazy(() =>
  import("@/components/CollectionsPage").then((m) => ({
    default: m.CollectionsPage,
  })),
);
const GuidesPage = lazy(() =>
  import("@/components/GuidesPage").then((m) => ({
    default: m.GuidesPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("@/components/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);
const RequestsPage = lazy(() =>
  import("@/components/RequestsPage").then((m) => ({
    default: m.RequestsPage,
  })),
);

const normalizeSearch = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

type Page = "home" | "discover" | "gallery" | "collections" | "test-discover" | "feedback" | "privacy" | "cookies" | "guides" | "profile" | "admin" | "requests" | "404";

function getInitialPage(): Page {
  const path = window.location.pathname;
  if (path === "/gallery") return "gallery";
  if (path === "/discover") return "discover";
  if (path === "/feedback") return "feedback";
  if (path === "/test-discover") return "test-discover";
  if (path === "/confidentialite") return "privacy";
  if (path === "/cookies") return "cookies";
  if (path === "/profil") return "profile";
  if (path === "/admin") return "admin";
  if (path === "/collections") return "collections";
  if (path === "/guides") return "guides";
  if (path === "/demandes") return "requests";
  // OAuth callback → go straight to discover
  if (new URLSearchParams(window.location.search).has("code")) return "discover";
  if (path === "/") return "home";
  return "404";
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
  // Restore state from URL query params on initial load
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [searchQuery, setSearchQuery] = useState(initialParams.get("q") ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(
    initialParams.get("galleryId"),
  );
  const [selectedContributor, setSelectedContributor] = useState<string | null>(
    initialParams.get("contributor"),
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedUserCollectionId, setSelectedUserCollectionId] = useState<string | null>(initialParams.get("collectionId"));
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites(!!user);
  const { getLikeCount, hasLiked, toggleLike } = useLikes(!!user);
  const activeRequestCount = useActiveRequestCount();
  const { notifications: feedbackNotifications, unreadCount: feedbackUnreadCount, markAsRead: feedbackMarkAsRead, markAllAsRead: feedbackMarkAllAsRead, dismiss: feedbackDismiss, dismissAll: feedbackDismissAll } =
    useFeedbackNotifications(!!user);
  const {
    notifications: appNotifications,
    unreadCount: appUnreadCount,
    fetchNotifications: fetchAppNotifications,
    markAsRead: appMarkAsRead,
    markAllAsRead: appMarkAllAsRead,
    dismiss: appDismiss,
    dismissAll: appDismissAll,
  } = useNotifications(!!user);
  const {
    collections: userCollections,
    create: createUserCollection,
    update: updateUserCollection,
    remove: removeUserCollection,
    addPictogram: addToUserCollection,
    removePictogram: removeFromUserCollection,
    refetch: refetchUserCollections,
  } = useUserCollections(!!user);
  const { userPictograms, blobUrls, refetch: refetchUserPictograms } = useUserPictograms(!!user);
  const handleUserPictoUploadSuccess = useCallback(async () => {
    await Promise.allSettled([refetchUserPictograms(), refetchUserCollections()]);
  }, [refetchUserPictograms, refetchUserCollections]);

  // Quand on est dans une collection utilisateur, rafraîchir aussi les userPictograms
  // (les pictos privés ont leur nom/tags stockés dans userPictograms, pas dans pictograms)
  const handlePictogramUpdatedInGallery = useCallback(async () => {
    await refetchPictograms();
    if (selectedUserCollectionId) {
      await refetchUserPictograms();
    }
  }, [refetchPictograms, refetchUserPictograms, selectedUserCollectionId]);

  const handleDeleteUserPictogram = useCallback(async (id: string) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/pictograms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await Promise.allSettled([refetchUserPictograms(), refetchUserCollections()]);
        toast.success("Pictogramme supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  }, [refetchUserPictograms, refetchUserCollections]);
  const [userPictoUploadOpen, setUserPictoUploadOpen] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token && user) {
      setIsCollaborator(getIsCollaboratorFromToken(token));
    } else {
      setIsCollaborator(false);
    }
  }, [user]);

  // Rediriger vers home si page admin sans autorisation
  useEffect(() => {
    if (page === "admin" && !authLoading && !isCollaborator) {
      navigateTo("home");
    }
  }, [page, isCollaborator, authLoading]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === "/gallery") setPage("gallery");
      else if (path === "/discover") setPage("discover");
      else if (path === "/feedback") setPage("feedback");
      else if (path === "/confidentialite") setPage("privacy");
      else if (path === "/cookies") setPage("cookies");
      else if (path === "/profil") setPage("profile");
      else if (path === "/admin") setPage("admin");
      else if (path === "/collections") setPage("collections");
      else if (path === "/guides") setPage("guides");
      else if (path === "/demandes") setPage("requests");
      else if (path === "/") setPage("home");
      else setPage("404");
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
              : target === "privacy"
                ? "/confidentialite"
                : target === "cookies"
                ? "/cookies"
                : target === "profile"
                  ? "/profil"
                  : target === "admin"
                    ? "/admin"
                    : target === "collections"
                      ? "/collections"
                      : target === "guides"
                        ? "/guides"
                        : target === "requests"
                          ? "/demandes"
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

  // Sync URL query params with gallery/collection/search state
  const updateUrlParams = useCallback((path: string, params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    url.pathname = path;
    // Clear old params
    for (const key of ["galleryId", "contributor", "collectionId", "q"]) {
      url.searchParams.delete(key);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
    window.history.pushState(null, "", url.pathname + url.search);
  }, []);

  const handleSelectGallery = (id: string | null) => {
    setSelectedGalleryId(id);
    setSelectedUserCollectionId(null);
    setShowFavoritesOnly(false);
    setCurrentPage(1);
    if (page !== "gallery") {
      navigateTo("gallery");
    }
    updateUrlParams("/gallery", { galleryId: id });
  };

  const handleSelectContributor = (contributor: string | null) => {
    setSelectedContributor(contributor);
    setSelectedUserCollectionId(null);
    setShowFavoritesOnly(false);
    setCurrentPage(1);
    if (page !== "gallery") {
      navigateTo("gallery");
    }
    updateUrlParams("/gallery", { contributor });
  };

  const handleSelectUserCollection = (id: string | null) => {
    setSelectedUserCollectionId(id);
    setSelectedGalleryId(null);
    setSelectedContributor(null);
    setShowFavoritesOnly(false);
    setCurrentPage(1);
    if (id && page !== "collections") {
      navigateTo("collections");
    }
    updateUrlParams("/collections", { collectionId: id });
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

  const filteredPictogramsGallery = useMemo(() => {
    let result = pictograms;

    if (selectedGalleryId) {
      const gallery = galleries.find((g) => g.id === selectedGalleryId);
      if (gallery) {
        const pictoIdsInGallery = new Set(gallery.pictogramIds);
        result = result.filter((picto) => pictoIdsInGallery.has(picto.id));
      }
    }

    if (selectedContributor) {
      result = result.filter(
        (picto) => picto.contributor?.githubUsername === selectedContributor,
      );
    }

    if (searchQuery) {
      const query = normalizeSearch(searchQuery);
      result = result.filter(
        (picto) =>
          normalizeSearch(picto.name).includes(query) ||
          normalizeSearch(picto.id).includes(query) ||
          normalizeSearch(picto.filename).includes(query) ||
          picto.tags?.some((tag) => normalizeSearch(tag).includes(query)) ||
          (picto.contributor &&
            normalizeSearch(picto.contributor.githubUsername).includes(query)),
      );
    }

    return result;
  }, [pictograms, searchQuery, selectedGalleryId, selectedContributor, galleries]);

  const filteredPictogramsCollections = useMemo(() => {
    let result = pictograms;

    if (showFavoritesOnly) {
      result = result.filter((picto) => isFavorite(picto.id));
    }

    if (selectedUserCollectionId) {
      const col = userCollections.find((c) => c.id === selectedUserCollectionId);
      if (col) {
        const ids = new Set(col.pictogramIds);
        result = result.filter((picto) => ids.has(picto.id));

        // Injecter les pictos privés de la collection comme des Pictogram normaux
        const now = new Date().toISOString();
        const privateAsPublic = userPictograms
          .filter((p) => col.userPictogramIds.includes(p.id) && blobUrls.has(p.id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            filename: p.filename,
            url: blobUrls.get(p.id)!,
            size: p.size,
            lastModified: p.updatedAt ?? p.createdAt ?? now,
            tags: p.tags,
          }));

        result = [...privateAsPublic, ...result];
      }
    }

    if (searchQuery) {
      const query = normalizeSearch(searchQuery);
      result = result.filter(
        (picto) =>
          normalizeSearch(picto.name).includes(query) ||
          normalizeSearch(picto.id).includes(query) ||
          normalizeSearch(picto.filename).includes(query) ||
          picto.tags?.some((tag) => normalizeSearch(tag).includes(query)) ||
          (picto.contributor &&
            normalizeSearch(picto.contributor.githubUsername).includes(query)),
      );
    }

    return result;
  }, [
    pictograms,
    searchQuery,
    showFavoritesOnly,
    isFavorite,
    selectedUserCollectionId,
    userCollections,
    userPictograms,
    blobUrls,
  ]);

  const collectionsPrivateIds = useMemo(
    () =>
      selectedUserCollectionId
        ? new Set(
            userCollections.find((c) => c.id === selectedUserCollectionId)
              ?.userPictogramIds ?? [],
          )
        : undefined,
    [selectedUserCollectionId, userCollections],
  );

  // Home page — rendered before gallery data is needed
  if (page === "home") {
    return (
      <>
        <SEOHead path="/" />
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
      </>
    );
  }

  // 404 page
  if (page === "404") {
    return (
      <Suspense fallback={null}>
        <NotFoundPage onGoHome={() => navigateTo("home")} onGoGallery={() => navigateTo("gallery")} />
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
  // Only block rendering on initial load (no data yet), not on background refetches
  if (
    (loading && pictograms.length === 0) ||
    authLoading ||
    (galleriesLoading && galleries.length === 0)
  ) {
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

  const seoForPage = (() => {
    switch (page) {
      case "discover":
        return <SEOHead title="Découvrir" description="Découvrez les derniers pictogrammes SVG ajoutés à La Boite à Pictos. Parcourez les galeries et trouvez l'inspiration." path="/discover" />;
      case "gallery":
        return <SEOHead title="Galerie" description="Parcourez tous les pictogrammes SVG de La Boite à Pictos. Filtrez par galerie, contributeur ou mot-clé." path="/gallery" />;
      case "collections":
        return <SEOHead title="Mes collections" description="Gérez vos collections personnelles de pictogrammes SVG sur La Boite à Pictos." path="/collections" />;
      case "feedback":
        return <SEOHead title="Feedback" description="Partagez vos retours et suggestions pour améliorer La Boite à Pictos." path="/feedback" />;
      case "profile":
        return <SEOHead title="Mon profil" path="/profil" />;
      case "admin":
        return <SEOHead title="Administration" path="/admin" />;
      case "privacy":
        return <SEOHead title="Politique de confidentialité" description="Politique de confidentialité de La Boite à Pictos. Découvrez comment vos données sont traitées." path="/confidentialite" />;
      case "cookies":
        return <SEOHead title="Gestion des cookies" description="Politique de gestion des cookies de La Boite à Pictos." path="/cookies" />;
      case "requests":
        return <SEOHead title="Mes demandes" description="Demandez la création de nouveaux pictogrammes SVG sur La Boite à Pictos." path="/demandes" />;
      case "guides":
        return <SEOHead title="Guides" description="Tutoriels pas-à-pas pour utiliser La Boite à Pictos : personnaliser les couleurs, télécharger, créer des collections et plus." path="/guides" />;
      default:
        return null;
    }
  })();

  return (
    <DownloadsContext.Provider value={downloadsValue}>
    {seoForPage}
    <TooltipProvider>
      <div className="relative">
        {/* ── Background orbs + dot grid (Proposition B) ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-[10%] -right-[5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-[#fddede] to-[#c83f49] blur-3xl opacity-8 motion-safe:animate-pulse"
            style={{ animationDuration: "15s" }}
          />
          <div
            className="absolute -bottom-[10%] -left-[5%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-[#e3e3fd] to-[#6a6af4] blur-3xl opacity-8 motion-safe:animate-pulse"
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
          onGoGuides={() => navigateTo("guides")}
          onGoFeedback={() => navigateTo("feedback")}
          onGoProfile={() => navigateTo("profile")}
          onGoAdmin={() => navigateTo("admin")}
          onGoRequests={() => navigateTo("requests")}
          activeRequestCount={activeRequestCount}
          isCollaborator={isCollaborator}
          currentPage={page}
          favoritesCount={favoritesCount}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={() => {
            setShowFavoritesOnly(true);
            setSelectedUserCollectionId(null);
            setCurrentPage(1);
            if (page !== "collections") navigateTo("collections");
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
            notifications={feedbackNotifications}
            unreadCount={feedbackUnreadCount + appUnreadCount}
            onMarkRead={feedbackMarkAsRead}
            onMarkAllRead={() => { feedbackMarkAllAsRead(); appMarkAllAsRead(); }}
            onDismissNotif={feedbackDismiss}
            onDismissAppNotif={appDismiss}
            onClearAllNotifs={() => { feedbackDismissAll(); appDismissAll(); }}
            onGoFeedback={() => navigateTo("feedback")}
            appNotifications={appNotifications}
            appUnreadCount={appUnreadCount}
            onAppMarkRead={appMarkAsRead}
            onAppMarkAllRead={appMarkAllAsRead}
            onGoRequests={() => navigateTo("requests")}
            onFetchAppNotifications={fetchAppNotifications}
          />
          <main id="main-content" className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {page === "privacy" ? (
                <Suspense fallback={null}>
                  <PrivacyPage />
                </Suspense>
              ) : page === "cookies" ? (
                <Suspense fallback={null}>
                  <CookiesPage />
                </Suspense>
              ) : page === "guides" ? (
                <Suspense fallback={null}>
                  <GuidesPage />
                </Suspense>
              ) : page === "profile" ? (
                <Suspense fallback={null}>
                  <ProfilePage
                    onDeleted={() => { logout(); navigateTo("home"); }}
                  />
                </Suspense>
              ) : page === "admin" && isCollaborator ? (
                <Suspense fallback={null}>
                  <AdminPage activeRequestCount={activeRequestCount} />
                </Suspense>
              ) : page === "requests" ? (
                <Suspense fallback={null}>
                  <RequestsPage
                    isAuthenticated={!!user}
                    onLogin={handleLogin}
                  />
                </Suspense>
              ) : page === "feedback" ? (
                <Suspense fallback={null}>
                  <FeedbackPage user={user} onLogin={handleLogin} isCollaborator={isCollaborator} />
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
              ) : page === "collections" ? (
                <Suspense fallback={null}>
                  <CollectionsPage
                    user={user}
                    onGoGallery={() => navigateTo("gallery")}
                    selectedUserCollectionId={selectedUserCollectionId}
                    showFavoritesOnly={showFavoritesOnly}
                    setShowFavoritesOnly={setShowFavoritesOnly}
                    userCollections={userCollections}
                    filteredPictograms={filteredPictogramsCollections}
                    galleries={galleries}
                    isAuthenticated={!!user}
                    onPictogramUpdated={handlePictogramUpdatedInGallery}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    onLogin={handleLogin}
                    onAddToUserCollection={user ? addToUserCollection : undefined}
                    onRemoveFromUserCollection={user ? removeFromUserCollection : undefined}
                    getLikeCount={getLikeCount}
                    hasLiked={hasLiked}
                    onToggleLike={user ? toggleLike : undefined}
                    privateIds={collectionsPrivateIds}
                    onDeletePrivatePictogram={selectedUserCollectionId ? handleDeleteUserPictogram : undefined}
                    onUploadSvgClick={() => setUserPictoUploadOpen(true)}
                    onDeletePictogram={user ? handleDeletePictogram : undefined}
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
                          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">{gal.name}</h2>
                          <span className="text-xs text-muted-foreground font-medium">{gal.pictogramIds.length} picto{gal.pictogramIds.length !== 1 ? "s" : ""}</span>
                        </div>
                        {gal.description && (
                          <p className="text-sm text-muted-foreground pl-6">{gal.description}</p>
                        )}
                      </div>
                    );
                  })()}
                  {/* En-tête Tous les pictos */}
                  {!selectedGalleryId && !selectedContributor && (
                    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-tertiary">Tous les pictos</h2>
                    </div>
                  )}
                  <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
                    <PictoGrid
                      key={`${selectedGalleryId ?? "all"}|${selectedContributor ?? ""}`}
                      pictograms={filteredPictogramsGallery}
                      galleries={galleries}
                      onAddToGallery={addPictogramToGallery}
                      onRemoveFromGallery={removePictogramFromGallery}
                      isAuthenticated={!!user}
                      user={user}
                      selectedGalleryId={selectedGalleryId}
                      onPictogramUpdated={handlePictogramUpdatedInGallery}
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
          </main>
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

        {userPictoUploadOpen && selectedUserCollectionId && (() => {
          const col = userCollections.find(c => c.id === selectedUserCollectionId);
          if (!col) return null;
          return (
            <UserPictoUploadDialog
              open={userPictoUploadOpen}
              onOpenChange={setUserPictoUploadOpen}
              collectionId={selectedUserCollectionId}
              collectionName={col.name}
              onUploadSuccess={handleUserPictoUploadSuccess}
            />
          );
        })()}

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
