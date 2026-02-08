import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import type { Gallery } from "@/lib/types";

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
        throw new Error("Erreur lors de la creation de la galerie");
      }
      const gallery: Gallery = await response.json();
      setGalleries((prev) => [...prev, gallery]);
      return gallery;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
        throw new Error("Erreur lors de la mise a jour de la galerie");
      }
      const gallery: Gallery = await response.json();
      setGalleries((prev) => prev.map((g) => (g.id === id ? gallery : g)));
      return gallery;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
        throw new Error("Erreur lors de la suppression de la galerie");
      }
      setGalleries((prev) => prev.filter((g) => g.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    }
  }

  async function addPictogramToGallery(
    galleryId: string,
    pictogramId: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/api/galleries/${galleryId}/pictograms`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ pictogramId }),
        },
      );
      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du pictogramme");
      }
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === galleryId
            ? { ...g, pictogramIds: [...g.pictogramIds, pictogramId] }
            : g,
        ),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    }
  }

  async function removePictogramFromGallery(
    galleryId: string,
    pictogramId: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/api/galleries/${galleryId}/pictograms/${pictogramId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) {
        throw new Error("Erreur lors du retrait du pictogramme");
      }
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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
