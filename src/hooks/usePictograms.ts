import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import { toast } from "sonner";
import type { Pictogram, PictogramManifest } from "@/lib/types";

export function usePictograms() {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchManifest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/pictograms/manifest`);
      if (!response.ok) {
        throw new Error("Failed to fetch pictograms manifest");
      }

      const data: PictogramManifest = await response.json();
      setPictograms(data.pictograms.filter(p => !p.filename.endsWith("_dark.svg")));
      setLastUpdated(data.lastUpdated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const deletePictogram = useCallback(
    async (id: string): Promise<boolean> => {
      const prev = pictograms;
      setPictograms((current) => current.filter((p) => p.id !== id));

      try {
        const token = getStoredToken();
        const response = await fetch(`${API_URL}/api/pictograms/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to delete pictogram");
        }
        return true;
      } catch {
        setPictograms(prev);
        toast.error("Erreur lors de la suppression du pictogramme");
        return false;
      }
    },
    [pictograms],
  );

  return {
    pictograms,
    loading,
    error,
    lastUpdated,
    refetch: fetchManifest,
    deletePictogram,
  };
}
