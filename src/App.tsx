import { useEffect, useMemo, useState } from "react";
import { usePictograms } from "@/hooks/usePictograms";
import { useGalleries } from "@/hooks/useGalleries";
import { PictoGrid } from "@/components/PictoGrid";
import { AppSidebar } from "@/components/Sidebar";
import { SiteHeader } from "@/components/site-header";
import { GalleryDialog } from "@/components/GalleryDialog";
import { UploadDialog } from "@/components/UploadDialog";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  initiateGitHubLogin,
  handleGitHubCallback,
  getGitHubUser,
  logout,
  getStoredToken,
  type GitHubUser,
} from "@/lib/github-auth";

function App() {
  const {
    pictograms,
    loading,
    error,
    lastUpdated,
    refetch: refetchPictograms,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(
    null,
  );
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

  const handleUploadSuccess = async () => {
    setUploadDialogOpen(false);
    toast.success("Pictogramme uploadé avec succès !");
    await Promise.all([refetchPictograms(), refetchGalleries()]);
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
          (picto.category && normalize(picto.category).includes(query)) ||
          picto.tags?.some((tag) => normalize(tag).includes(query)) ||
          (picto.contributor &&
            normalize(picto.contributor.githubUsername).includes(query)),
      );
    }

    return result;
  }, [pictograms, searchQuery, selectedGalleryId, galleries]);

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
          selectedGalleryId={selectedGalleryId}
          onSelectGallery={setSelectedGalleryId}
          totalPictogramCount={pictograms.length}
          user={user}
          onLogin={initiateGitHubLogin}
          onLogout={logout}
          onUploadClick={() => setUploadDialogOpen(true)}
          onCreateGallery={handleCreateGallery}
          onEditGallery={handleEditGallery}
          onDeleteGallery={handleDeleteGallery}
          onAddToGallery={addPictogramToGallery}
        />

        <SidebarInset>
          <SiteHeader
            onSearch={setSearchQuery}
            totalCount={pictograms.length}
            filteredCount={filteredPictograms.length}
          />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Derniere mise a jour :{" "}
                      {new Date(lastUpdated).toLocaleString("fr-FR")}
                    </p>
                  )}
                  <PictoGrid
                    pictograms={filteredPictograms}
                    galleries={galleries}
                    onAddToGallery={addPictogramToGallery}
                    onRemoveFromGallery={removePictogramFromGallery}
                    isAuthenticated={!!user}
                    selectedGalleryId={selectedGalleryId}
                    onPictogramUpdated={refetchPictograms}
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>

        <UploadDialog
          onUploadSuccess={handleUploadSuccess}
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />

        <GalleryDialog
          open={galleryDialogOpen}
          onOpenChange={setGalleryDialogOpen}
          gallery={editingGallery}
          onSave={handleSaveGallery}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default App;
