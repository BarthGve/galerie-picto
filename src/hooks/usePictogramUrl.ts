import { useEffect, useMemo, useRef, useState } from "react";
import type { Pictogram } from "@/lib/types";
import { useTheme } from "@/hooks/use-theme";
import { fetchSvgText } from "@/lib/svg-to-png";
import { replaceSvgColors } from "@/lib/svg-color-parser";

/**
 * Couleurs non-standard fréquentes → couleurs DSFR officielles.
 * Appliquées avant le remap dark pour garantir la cohérence.
 */
const NORMALIZE_TO_DSFR: Record<string, string> = {
  "#303277": "#000091", // bleu foncé non-standard → blue-france-113
  "#e3201a": "#e1000f", // rouge non-standard → red-marianne-425
};

/**
 * Mapping couleurs DSFR light → dark pour les pictogrammes artwork.
 * Aligné sur backend/src/services/dsfr-dark.ts
 */
const DSFR_LIGHT_TO_DARK: Record<string, string> = {
  "#000091": "#8585f6", // blue-france-113 → blue-france-625 (artwork-major)
  "#e1000f": "#f95c5e", // red-marianne-425 → red-marianne-625 (artwork-minor)
  "#ececff": "#21213f", // blue-france-950 → blue-france-100 (artwork-decorative)
  "#e3e3fd": "#313178", // blue-france-925 → blue-france-125
  "#cacafb": "#3a3a7d", // blue-france-850 → blue-france-150
  "#6a6af4": "#8585f6", // blue-france-main-525 → blue-france-625
  "#000000": "#ffffff", // noir pur → blanc (pour SVG noir/blanc type QR code)
  "#ffffff": "#1e1e1e", // blanc pur → fond sombre
};

/**
 * Retourne l'URL du pictogramme adaptée au thème courant.
 * En dark mode → fetch le SVG, normalise les couleurs, et applique le remap DSFR dark.
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
      return;
    }

    // Skip if already generated for this URL
    if (blobUrlRef.current) return;

    let cancelled = false;

    fetchSvgText(pictogram.url).then((svgText) => {
      if (cancelled) return;
      const normalized = replaceSvgColors(svgText, NORMALIZE_TO_DSFR);
      const darkSvg = replaceSvgColors(normalized, DSFR_LIGHT_TO_DARK);
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
  }, [isDark, pictogram.url]);

  return useMemo(() => {
    if (isDark && blobUrl) return blobUrl;
    return pictogram.url;
  }, [isDark, pictogram.url, blobUrl]);
}
