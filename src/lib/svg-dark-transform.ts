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
 * Prefetch batch : pré-remplit le cache avec des promises non-résolues
 * pour chaque URL manquante, AVANT d'envoyer la requête batch.
 *
 * Les composants (usePictogramUrl) qui appellent getDarkSvgText() trouvent
 * immédiatement une promise dans le cache et s'y abonnent. Quand le batch
 * retourne, toutes les promises se résolvent en même temps → tous les pictos
 * passent en dark simultanément.
 *
 * Fallback sur des fetches individuels si le batch échoue.
 */
export function prefetchDarkSvgs(urls: string[]): void {
  if (urls.length === 0) return;

  const missing = urls.filter((url) => !darkSvgCache.has(url));
  if (missing.length === 0) return;

  // Pré-remplir le cache avec des promises non-résolues pour chaque URL manquante.
  // Les composants qui appellent getDarkSvgText() trouveront ces promises et attendront.
  const resolvers = new Map<string, (value: string) => void>();
  const rejecters = new Map<string, (err: unknown) => void>();

  for (const url of missing) {
    const promise = new Promise<string>((resolve, reject) => {
      resolvers.set(url, resolve);
      rejecters.set(url, reject);
    });
    darkSvgCache.set(url, promise);
  }

  // Lance le batch en arrière-plan
  fetch(`${API_URL}/api/proxy/svg-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: missing }),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Batch failed: ${response.status}`);
      return response.json() as Promise<{
        results: { url: string; svgText?: string; error?: string }[];
      }>;
    })
    .then(({ results }) => {
      for (const result of results) {
        if (result.svgText) {
          resolvers.get(result.url)?.(transformSvgToDark(result.svgText));
        } else {
          // Supprimer du cache et rejeter pour permettre un retry
          darkSvgCache.delete(result.url);
          rejecters.get(result.url)?.(new Error(result.error ?? "fetch_failed"));
        }
      }
    })
    .catch((err) => {
      // Batch échoué : supprimer les promises en attente du cache
      // et lancer des fetches individuels en fallback
      console.warn("[prefetchDarkSvgs] Batch failed, falling back to individual fetches:", err);
      for (const url of missing) {
        darkSvgCache.delete(url);
        rejecters.get(url)?.(err);
      }
      missing.forEach((url) => getDarkSvgText(url));
    });
}
