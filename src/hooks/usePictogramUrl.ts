import { useEffect, useMemo, useRef, useState } from "react";
import type { Pictogram } from "@/lib/types";
import { useTheme } from "@/hooks/use-theme";
import { fetchSvgText } from "@/lib/svg-to-png";
import { replaceSvgColors } from "@/lib/svg-color-parser";

/**
 * Mapping couleurs DSFR light → dark pour les pictogrammes artwork.
 * Source : systeme-de-design.gouv.fr/fondamentaux/pictogramme
 */
const DSFR_LIGHT_TO_DARK: Record<string, string> = {
  "#2845c1": "#5b7de8", // blue-france-113 → blue-france-625 (artwork-major)
  "#c83f49": "#e06670", // red-marianne-425 → red-marianne-625 (artwork-minor)
  "#ececff": "#21213f", // blue-france-950 → blue-france-100 (artwork-decorative)
};

/**
 * Retourne l'URL du pictogramme adaptée au thème courant.
 * - Si une variante _dark existe → utilise darkUrl
 * - Sinon, en dark mode → fetch le SVG et applique les couleurs DSFR dark
 * - En light mode → URL d'origine
 */
export function usePictogramUrl(pictogram: Pictogram): string {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const needsRemap = isDark && !pictogram.darkUrl;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!needsRemap) {
      // Switched back to light: revoke previous blob via ref only (no setState needed,
      // useMemo ignores blobUrl when needsRemap is false)
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      return;
    }

    // Skip if already generated for this URL
    if (blobUrlRef.current) return;

    let cancelled = false;

    fetchSvgText(pictogram.url).then((svgText) => {
      if (cancelled) return;
      const darkSvg = replaceSvgColors(svgText, DSFR_LIGHT_TO_DARK);
      const blob = new Blob([darkSvg], { type: "image/svg+xml" });
      const objectUrl = URL.createObjectURL(blob);
      blobUrlRef.current = objectUrl;
      setBlobUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [needsRemap, pictogram.url]);  

  return useMemo(() => {
    if (isDark && pictogram.darkUrl) return pictogram.darkUrl;
    if (needsRemap && blobUrl) return blobUrl;
    return pictogram.url;
  }, [isDark, pictogram.darkUrl, pictogram.url, needsRemap, blobUrl]);
}
