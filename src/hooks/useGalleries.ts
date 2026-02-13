import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import type { Gallery } from "@/lib/types";
import { toast } from "sonner";

export function useGalleries() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGalleries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/galleries`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des galeries");
      }
      const data = await response.json();
      setGalleries(data.galleries ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

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
          err.error || "Erreur lors de la creation de la galerie",
        );
      }
      const gallery: Gallery = await response.json();
      setGalleries((prev) => [...prev, gallery]);
      toast.success(`Collection « ${gallery.name} » créée`);
      return gallery;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
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
          err.error || "Erreur lors de la mise a jour de la galerie",
        );
      }
      const gallery: Gallery = await response.json();
      setGalleries((prev) => prev.map((g) => (g.id === id ? gallery : g)));
      toast.success(`Collection « ${gallery.name} » mise à jour`);
      return gallery;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
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
      setError(msg);
      toast.error(msg);
      return false;
    }
  }

  async function addPictogramToGallery(
    galleryId: string,
    pictogramId: string,
  ): Promise<boolean> {
    // Guard: skip if already in gallery
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
      setError(msg);
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
      setError(msg);
      toast.error(msg);
      return false;
    }
  }

  return {
    galleries,
    loading,
    error,
    refetch: fetchGalleries,
    createGallery,
    updateGallery,
    deleteGallery,
    addPictogramToGallery,
    removePictogramFromGallery,
  };
}
