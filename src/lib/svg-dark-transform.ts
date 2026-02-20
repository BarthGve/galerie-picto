import { API_URL } from "@/lib/config";
import { replaceSvgColors } from "@/lib/svg-color-parser";
import { fetchSvgText } from "@/lib/svg-to-png";

/**
 * Couleurs non-standard fréquentes → couleurs DSFR officielles.
 */
export const NORMALIZE_TO_DSFR: Record<string, string> = {
  "#303277": "#000091", // bleu foncé non-standard → blue-france-113
  "#e3201a": "#e1000f", // rouge non-standard → red-marianne-425
};

/**
 * Mapping couleurs DSFR light → dark pour les pictogrammes artwork.
 */
export const DSFR_LIGHT_TO_DARK: Record<string, string> = {
  "#000091": "#8585f6", // blue-france-113 → blue-france-625 (artwork-major)
  "#e1000f": "#f95c5e", // red-marianne-425 → red-marianne-625 (artwork-minor)
  "#ececff": "#21213f", // blue-france-950 → blue-france-100 (artwork-decorative)
  "#e3e3fd": "#313178", // blue-france-925 → blue-france-125
  "#cacafb": "#3a3a7d", // blue-france-850 → blue-france-150
  "#6a6af4": "#8585f6", // blue-france-main-525 → blue-france-625
  "#000000": "#ffffff", // noir pur → blanc
  "#ffffff": "#1e1e1e", // blanc pur → fond sombre
};

export function transformSvgToDark(svgText: string): string {
  const normalized = replaceSvgColors(svgText, NORMALIZE_TO_DSFR);
  return replaceSvgColors(normalized, DSFR_LIGHT_TO_DARK);
}

/**
 * Cache module-level : url → promise du SVG text transformé (dark).
 * Partagé entre toutes les instances de usePictogramUrl et prefetchDarkSvgs.
 * En cas d'erreur, supprimé du cache pour permettre un retry.
 */
export const darkSvgCache = new Map<string, Promise<string>>();

/**
 * Retourne la promise du SVG dark pour une URL.
 * Utilise le cache ou lance un fetch individuel via le proxy.
 */
export function getDarkSvgText(url: string): Promise<string> {
  if (!darkSvgCache.has(url)) {
    const promise = fetchSvgText(url)
      .then(transformSvgToDark)
      .catch((err) => {
        darkSvgCache.delete(url);
        throw err;
      });
    darkSvgCache.set(url, promise);
  }
  return darkSvgCache.get(url)!;
}

/**
 * Prefetch batch : envoie toutes les URLs en une seule requête au backend,
 * remplit le cache, puis les instances de usePictogramUrl trouvent le cache déjà prêt.
 * Fallback sur des fetches individuels si le batch échoue.
 */
export async function prefetchDarkSvgs(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const missing = urls.filter((url) => !darkSvgCache.has(url));
  if (missing.length === 0) return;

  try {
    const response = await fetch(`${API_URL}/api/proxy/svg-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: missing }),
    });

    if (!response.ok) throw new Error(`Batch failed: ${response.status}`);

    const data = (await response.json()) as {
      results: { url: string; svgText?: string; error?: string }[];
    };

    for (const result of data.results) {
      if (result.svgText && !darkSvgCache.has(result.url)) {
        darkSvgCache.set(result.url, Promise.resolve(transformSvgToDark(result.svgText)));
      } else if (result.error && !darkSvgCache.has(result.url)) {
        // Marque comme échouée pour éviter de retenter immédiatement
        console.warn(`[prefetchDarkSvgs] Failed for ${result.url}: ${result.error}`);
      }
    }
  } catch (err) {
    // Fallback : fetches individuels (comportement d'avant)
    console.warn("[prefetchDarkSvgs] Batch failed, falling back to individual fetches:", err);
    missing.forEach((url) => getDarkSvgText(url));
  }
}
