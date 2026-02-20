import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import { toast } from "sonner";
import type { Pictogram, PictogramManifest } from "@/lib/types";

interface PictogramsContextValue {
  pictograms: Pictogram[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetchPictograms: () => Promise<void>;
  deletePictogram: (id: string) => Promise<boolean>;
}

const PictogramsContext = createContext<PictogramsContextValue | null>(null);

export function PictogramsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refetchPictograms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/pictograms/manifest`);
      if (!response.ok) {
        throw new Error("Failed to fetch pictograms manifest");
      }
      const data: PictogramManifest = await response.json();
      setPictograms(data.pictograms.filter((p) => !p.filename.endsWith("_dark.svg")));
      setLastUpdated(data.lastUpdated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchPictograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <PictogramsContext.Provider
      value={{ pictograms, loading, error, lastUpdated, refetchPictograms, deletePictogram }}
    >
      {children}
    </PictogramsContext.Provider>
  );
}

export function usePictogramsCtx(): PictogramsContextValue {
  const ctx = useContext(PictogramsContext);
  if (!ctx) {
    throw new Error("usePictogramsCtx must be used within a PictogramsProvider");
  }
  return ctx;
}
