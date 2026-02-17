import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { API_URL } from "@/lib/config";

type DownloadsMap = Record<string, number>;

interface DownloadsContextValue {
  trackDownload: (pictogramId: string) => Promise<void>;
  getCount: (pictogramId: string) => number;
}

export const DownloadsContext = createContext<DownloadsContextValue>({
  trackDownload: async () => {},
  getCount: () => 0,
});

export function useDownloadsProvider() {
  const [downloads, setDownloads] = useState<DownloadsMap>({});
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch(`${API_URL}/api/pictograms/downloads`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: DownloadsMap) => setDownloads(data))
      .catch(() => {});
  }, []);

  const trackDownload = useCallback(async (pictogramId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/pictograms/${pictogramId}/download`,
        { method: "POST" },
      );
      if (res.ok) {
        const { downloads: count } = (await res.json()) as {
          downloads: number;
        };
        setDownloads((prev) => ({ ...prev, [pictogramId]: count }));
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const getCount = useCallback(
    (pictogramId: string) => downloads[pictogramId] || 0,
    [downloads],
  );

  return { trackDownload, getCount };
}

export function useDownloads() {
  return useContext(DownloadsContext);
}
