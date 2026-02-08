import { useState, useEffect } from "react";
import type { Pictogram, PictogramManifest } from "@/lib/types";

export function usePictograms() {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchManifest() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}pictograms-manifest.json`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch pictograms manifest");
        }

        const data: PictogramManifest = await response.json();
        setPictograms(data.pictograms);
        setLastUpdated(data.lastUpdated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchManifest();
  }, []);

  return { pictograms, loading, error, lastUpdated };
}
