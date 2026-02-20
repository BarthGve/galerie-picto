import { useEffect, useMemo, useRef, useState } from "react";
import type { Pictogram } from "@/lib/types";
import { useTheme } from "@/hooks/use-theme";
import { darkSvgCache, getDarkSvgText } from "@/lib/svg-dark-transform";

/**
 * Retourne l'URL du pictogramme adaptée au thème courant.
 * En dark mode → utilise le cache partagé (rempli en batch par useDarkPrefetch)
 *                 ou lance un fetch individuel si le cache est vide.
 * En light mode → URL d'origine.
 */
export function usePictogramUrl(pictogram: Pictogram): string {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Effet principal : attend la promise du SVG dark et crée la blob URL
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

  // Effet de synchronisation : si le cache batch a déjà résolu cette URL
  // avant que le composant se monte, crée la blob URL immédiatement
  useEffect(() => {
    if (!isDark || blobUrlRef.current) return;
    const cached = darkSvgCache.get(pictogram.url);
    if (!cached) return;
    let cancelled = false;
    cached
      .then((darkSvg) => {
        if (cancelled || blobUrlRef.current) return;
        const blob = new Blob([darkSvg], { type: "image/svg+xml" });
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
      })
      .catch(() => {/* géré par getDarkSvgText */});
    return () => { cancelled = true; };
  }, [isDark, pictogram.url]);

  return useMemo(() => {
    if (isDark && blobUrl) return blobUrl;
    return pictogram.url;
  }, [isDark, pictogram.url, blobUrl]);
}
