import { useEffect, useMemo, useState } from "react";
import { usePictograms } from "@/hooks/usePictograms";
import { useGalleries } from "@/hooks/useGalleries";
import { PictoGrid } from "@/components/PictoGrid";
import { SearchBar } from "@/components/SearchBar";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { GalleryDialog } from "@/components/GalleryDialog";
import { UploadDialog } from "@/components/UploadDialog";
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
  const { pictograms, loading, error, lastUpdated } = usePictograms();
  const {
    galleries,
    loading: galleriesLoading,
    createGallery,
    updateGallery,
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
      setAuthLoading(false);
    }

    initAuth();
  }, []);

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    toast.info("Mise a jour de la galerie en cours...", {
      description: "La page va se recharger automatiquement",
      duration: 30000,
    });

    setTimeout(() => {
      window.location.reload();
    }, 30000);
  };

  const handleCreateGallery = () => {
    setEditingGallery(null);
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

    // Filter by selected gallery
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

    // Filter by search query (also searches in tags)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (picto) =>
          picto.name.toLowerCase().includes(query) ||
          picto.id.toLowerCase().includes(query) ||
          picto.filename.toLowerCase().includes(query) ||
          picto.tags?.some((tag) => tag.toLowerCase().includes(query)),
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        user={user}
        isAuthenticated={!!user}
        onLogin={initiateGitHubLogin}
        onLogout={logout}
        onUploadClick={() => setUploadDialogOpen(true)}
      />

      <div className="flex flex-1">
        <Sidebar
          galleries={galleries}
          selectedGalleryId={selectedGalleryId}
          onSelectGallery={setSelectedGalleryId}
          totalPictogramCount={pictograms.length}
          isAuthenticated={!!user}
          onCreateGallery={handleCreateGallery}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mb-4">
              Derniere mise a jour :{" "}
              {new Date(lastUpdated).toLocaleString("fr-FR")}
            </p>
          )}

          <SearchBar
            onSearch={setSearchQuery}
            totalCount={pictograms.length}
            filteredCount={filteredPictograms.length}
          />

          <PictoGrid pictograms={filteredPictograms} />
        </main>
      </div>

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

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Galerie de pictogrammes - {pictograms.length} elements disponibles
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
