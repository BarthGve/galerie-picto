import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_URL } from "@/lib/config";
import type { Gallery } from "@/lib/types";
import { toast } from "sonner";

interface GalleriesContextValue {
  galleries: Gallery[];
  galleriesLoading: boolean;
  galleriesError: string | null;
  refetchGalleries: () => Promise<void>;
  createGallery: (data: {
    name: string;
    description?: string;
    color?: string;
  }) => Promise<Gallery | null>;
  updateGallery: (
    id: string,
    data: { name?: string; description?: string; color?: string },
  ) => Promise<Gallery | null>;
  deleteGallery: (id: string) => Promise<boolean>;
  addPictogramToGallery: (
    galleryId: string,
    pictogramId: string,
  ) => Promise<boolean>;
  removePictogramFromGallery: (
    galleryId: string,
    pictogramId: string,
  ) => Promise<boolean>;
}

const GalleriesContext = createContext<GalleriesContextValue | null>(null);

export function GalleriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [galleriesLoading, setGalleriesLoading] = useState(true);
  const [galleriesError, setGalleriesError] = useState<string | null>(null);

  const refetchGalleries = useCallback(async () => {
    try {
      setGalleriesLoading(true);
      const response = await fetch(`${API_URL}/api/galleries`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des galeries");
      }
      const data = await response.json();
      setGalleries(data.galleries ?? []);
      setGalleriesError(null);
    } catch (err) {
      setGalleriesError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setGalleriesLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchGalleries();
  }, [refetchGalleries]);

  function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("github_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function createGallery(data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<Gallery | null> {
    try {
      const response = await fetch(`${API_URL}/api/galleries`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || "Erreur lors de la création de la galerie",
        );
      }
      const gallery: Gallery = await response.json();
      setGalleries((prev) => [...prev, gallery]);
      toast.success(`Collection « ${gallery.name} » créée`);
      return gallery;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setGalleriesError(msg);
      toast.error(msg);
      return null;
    }
  }

  async function updateGallery(
    id: string,
    data: { name?: string; description?: string; color?: string },
  ): Promise<Gallery | null> {
    try {
      const response = await fetch(`${API_URL}/api/galleries/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || "Erreur lors de la mise à jour de la galerie",
        );
      }
      const gallery: Gallery = await response.json();
      setGalleries((prev) => prev.map((g) => (g.id === id ? gallery : g)));
      toast.success(`Collection « ${gallery.name} » mise à jour`);
      return gallery;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setGalleriesError(msg);
      toast.error(msg);
      return null;
    }
  }

  async function deleteGallery(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/galleries/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || "Erreur lors de la suppression de la galerie",
        );
      }
      setGalleries((prev) => prev.filter((g) => g.id !== id));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setGalleriesError(msg);
      toast.error(msg);
      return false;
    }
  }

  async function addPictogramToGallery(
    galleryId: string,
    pictogramId: string,
  ): Promise<boolean> {
    const gallery = galleries.find((g) => g.id === galleryId);
    if (gallery?.pictogramIds.includes(pictogramId)) {
      return true;
    }

    // Optimistic update
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === galleryId && !g.pictogramIds.includes(pictogramId)
          ? { ...g, pictogramIds: [...g.pictogramIds, pictogramId] }
          : g,
      ),
    );

    try {
      const response = await fetch(
        `${API_URL}/api/galleries/${galleryId}/pictograms`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ pictogramIds: [pictogramId] }),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'ajout du pictogramme");
      }
      return true;
    } catch (err) {
      // Rollback
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === galleryId
            ? {
                ...g,
                pictogramIds: g.pictogramIds.filter((id) => id !== pictogramId),
              }
            : g,
        ),
      );
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setGalleriesError(msg);
      toast.error(msg);
      return false;
    }
  }

  async function removePictogramFromGallery(
    galleryId: string,
    pictogramId: string,
  ): Promise<boolean> {
    // Optimistic update
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === galleryId
          ? {
              ...g,
              pictogramIds: g.pictogramIds.filter((id) => id !== pictogramId),
            }
          : g,
      ),
    );

    try {
      const response = await fetch(
        `${API_URL}/api/galleries/${galleryId}/pictograms/${pictogramId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors du retrait du pictogramme");
      }
      return true;
    } catch (err) {
      // Rollback
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === galleryId
            ? { ...g, pictogramIds: [...g.pictogramIds, pictogramId] }
            : g,
        ),
      );
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setGalleriesError(msg);
      toast.error(msg);
      return false;
    }
  }

  return (
    <GalleriesContext.Provider
      value={{
        galleries,
        galleriesLoading,
        galleriesError,
        refetchGalleries,
        createGallery,
        updateGallery,
        deleteGallery,
        addPictogramToGallery,
        removePictogramFromGallery,
      }}
    >
      {children}
    </GalleriesContext.Provider>
  );
}

export function useGalleriesCtx(): GalleriesContextValue {
  const ctx = useContext(GalleriesContext);
  if (!ctx) {
    throw new Error("useGalleriesCtx must be used within a GalleriesProvider");
  }
  return ctx;
}
