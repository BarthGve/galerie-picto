import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import { toast } from "sonner";
import type { Pictogram, PictogramManifest } from "@/lib/types";

/**
 * Apparie les variantes _dark avec leur version light.
 * Les entrées _dark sont retirées de la liste principale et leur URL
 * est assignée en tant que `darkUrl` sur le pictogramme light correspondant.
 */
function pairDarkVariants(pictograms: Pictogram[]): Pictogram[] {
  // Index des variantes dark par nom de base (sans _dark et sans extension)
  const darkMap = new Map<string, Pictogram>();
  const lightList: Pictogram[] = [];

  for (const picto of pictograms) {
    const baseName = picto.filename.replace(/\.svg$/i, "");
    if (baseName.endsWith("_dark")) {
      const lightKey = baseName.replace(/_dark$/, "");
      darkMap.set(lightKey, picto);
    } else {
      lightList.push(picto);
    }
  }

  return lightList.map((picto) => {
    const lightKey = picto.filename.replace(/\.svg$/i, "");
    const darkVariant = darkMap.get(lightKey);
    if (darkVariant) {
      return { ...picto, darkUrl: darkVariant.url };
    }
    return picto;
  });
}

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
      setPictograms(pairDarkVariants(data.pictograms));
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
