/**
 * Service de génération automatique de variantes dark DSFR.
 *
 * Applique le mapping de couleurs DSFR light → dark sur un SVG.
 * Gère aussi la normalisation des couleurs proches des couleurs DSFR.
 */

// Couleurs DSFR non-standard fréquemment utilisées → couleurs DSFR officielles
const NORMALIZE_TO_DSFR: Record<string, string> = {
  "#303277": "#000091", // bleu foncé non-standard → blue-france-113
  "#e3201a": "#e1000f", // rouge non-standard → red-marianne-425
};

// Mapping couleurs DSFR light → dark
const DSFR_LIGHT_TO_DARK: Record<string, string> = {
  "#000091": "#8585f6", // blue-france-113 → blue-france-625 (artwork-major)
  "#e1000f": "#f95c5e", // red-marianne-425 → red-marianne-625 (artwork-minor)
  "#ececff": "#21213f", // blue-france-950 → blue-france-100 (artwork-decorative)
  "#e3e3fd": "#313178", // blue-france-925 → blue-france-125
  "#cacafb": "#3a3a7d", // blue-france-850 → blue-france-150
  "#6a6af4": "#8585f6", // blue-france-main-525 → blue-france-625
};

function replaceColors(
  svgText: string,
  colorMap: Record<string, string>,
): string {
  let result = svgText;
  for (const [original, replacement] of Object.entries(colorMap)) {
    if (original === replacement) continue;
    const regex = new RegExp(original, "gi");
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Normalise les couleurs non-standard vers les couleurs DSFR officielles
 */
export function normalizeToDsfr(svgText: string): string {
  return replaceColors(svgText, NORMALIZE_TO_DSFR);
}

/**
 * Génère une variante dark DSFR à partir d'un SVG en couleurs DSFR light.
 * Normalise d'abord les couleurs non-standard si nécessaire.
 */
export function generateDarkVariant(svgText: string): string {
  const normalized = normalizeToDsfr(svgText);
  return replaceColors(normalized, DSFR_LIGHT_TO_DARK);
}
