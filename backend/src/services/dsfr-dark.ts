/**
 * Service de normalisation des couleurs DSFR pour les SVG.
 *
 * Les variantes dark sont désormais générées côté client (usePictogramUrl.ts).
 * Ce service ne conserve que la normalisation des couleurs non-standard
 * vers les couleurs DSFR officielles, appliquée à l'upload.
 */

// Couleurs DSFR non-standard fréquemment utilisées → couleurs DSFR officielles
const NORMALIZE_TO_DSFR: Record<string, string> = {
  "#303277": "#000091", // bleu foncé non-standard → blue-france-113
  "#e3201a": "#e1000f", // rouge non-standard → red-marianne-425
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
