import { useEffect, useMemo, useRef, useState } from "react";
import type { Pictogram } from "@/lib/types";
import { useTheme } from "@/hooks/use-theme";
import { getDarkSvgText } from "@/lib/svg-dark-transform";

/**
 * Retourne l'URL du pictogramme adaptée au thème courant.
 *
 * En dark mode → s'abonne à la promise du cache (pré-remplie par useDarkPrefetch
 * via le batch endpoint). Si le batch est en vol, attend sa résolution. Si aucun
 * prefetch n'a été lancé, démarre un fetch individuel en fallback.
 * En light mode → URL d'origine.
 */
export function usePictogramUrl(pictogram: Pictogram): string {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDark) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setBlobUrl(null);
      return;
    }

    if (blobUrlRef.current) return;

    let cancelled = false;

    // getDarkSvgText retourne la promise du cache (pré-remplie par prefetchDarkSvgs)
    // ou lance un fetch individuel si aucun prefetch n'a été fait.
    // Dans les deux cas, le .then() s'exécute quand le SVG est prêt.
    getDarkSvgText(pictogram.url)
      .then((darkSvg) => {
        if (cancelled) return;
        const blob = new Blob([darkSvg], { type: "image/svg+xml" });
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn(`[usePictogramUrl] Dark transform failed for ${pictogram.url}:`, err);
        }
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [isDark, pictogram.url]);

  return useMemo(() => {
    if (isDark && blobUrl) return blobUrl;
    return pictogram.url;
  }, [isDark, pictogram.url, blobUrl]);
}
