/**
 * Parse un SVG et extrait toutes les couleurs uniques utilisées
 */

// Convertit une couleur CSS nommée en hex
const CSS_COLORS: Record<string, string> = {
  red: "#ff0000",
  blue: "#0000ff",
  green: "#008000",
  yellow: "#ffff00",
  black: "#000000",
  white: "#ffffff",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  gray: "#808080",
  grey: "#808080",
  brown: "#a52a2a",
  navy: "#000080",
  teal: "#008080",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00ff00",
  aqua: "#00ffff",
  silver: "#c0c0c0",
  fuchsia: "#ff00ff",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  indigo: "#4b0082",
  violet: "#ee82ee",
  coral: "#ff7f50",
  salmon: "#fa8072",
  gold: "#ffd700",
  khaki: "#f0e68c",
  crimson: "#dc143c",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
};

function normalizeColor(color: string): string | null {
  const trimmed = color.trim().toLowerCase();

  // Ignore non-colors
  if (
    !trimmed ||
    trimmed === "none" ||
    trimmed === "transparent" ||
    trimmed === "currentcolor" ||
    trimmed === "inherit"
  ) {
    return null;
  }

  // Named CSS color
  if (CSS_COLORS[trimmed]) return CSS_COLORS[trimmed];

  // Already hex
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) {
    // Normalize 3-char hex to 6-char
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed.slice(0, 7); // ignore alpha
  }

  // rgb/rgba
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  return null;
}

export interface SvgColorInfo {
  originalColors: string[]; // couleurs hex uniques trouvées
}

/**
 * Parse le texte SVG et retourne la liste des couleurs uniques
 */
export function parseSvgColors(svgText: string): SvgColorInfo {
  const colors = new Set<string>();

  // Parse as DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const elements = doc.querySelectorAll("*");

  elements.forEach((el) => {
    // Check fill and stroke attributes
    for (const attr of [
      "fill",
      "stroke",
      "stop-color",
      "flood-color",
      "lighting-color",
    ]) {
      const val = el.getAttribute(attr);
      if (val) {
        const normalized = normalizeColor(val);
        if (normalized) colors.add(normalized);
      }
    }

    // Check inline style
    const style = el.getAttribute("style");
    if (style) {
      const styleColors = style.match(
        /(?:fill|stroke|stop-color|color)\s*:\s*([^;]+)/gi,
      );
      if (styleColors) {
        for (const match of styleColors) {
          const val = match.split(":")[1];
          if (val) {
            const normalized = normalizeColor(val);
            if (normalized) colors.add(normalized);
          }
        }
      }
    }
  });

  // Also check for colors in <style> tags
  const styleTags = doc.querySelectorAll("style");
  styleTags.forEach((styleTag) => {
    const cssText = styleTag.textContent || "";
    const cssColors = cssText.match(
      /(?:fill|stroke|stop-color|color)\s*:\s*([^;}\s]+)/gi,
    );
    if (cssColors) {
      for (const match of cssColors) {
        const val = match.split(":")[1];
        if (val) {
          const normalized = normalizeColor(val);
          if (normalized) colors.add(normalized);
        }
      }
    }
  });

  return {
    originalColors: Array.from(colors),
  };
}

/**
 * Remplace les couleurs dans un SVG
 */
export function replaceSvgColors(
  svgText: string,
  colorMap: Record<string, string>, // originalHex -> newHex
): string {
  let result = svgText;

  for (const [original, replacement] of Object.entries(colorMap)) {
    if (original === replacement) continue;

    // Replace hex colors (case insensitive)
    const hexRegex = new RegExp(original.replace("#", "#"), "gi");
    result = result.replace(hexRegex, replacement);

    // Also try 3-char hex version if applicable
    if (original.length === 7) {
      const r = original[1];
      const g = original[3];
      const b = original[5];
      if (
        original[1] === original[2] &&
        original[3] === original[4] &&
        original[5] === original[6]
      ) {
        const shortHex = `#${r}${g}${b}`;
        const shortRegex = new RegExp(shortHex.replace("#", "#"), "gi");
        result = result.replace(shortRegex, replacement);
      }
    }

    // Replace named colors that map to this hex
    for (const [name, hex] of Object.entries(CSS_COLORS)) {
      if (hex === original) {
        // Replace in attributes: fill="red" -> fill="#newcolor"
        const nameRegex = new RegExp(
          `((?:fill|stroke|stop-color|color)\\s*=\\s*")${name}(")`,
          "gi",
        );
        result = result.replace(nameRegex, `$1${replacement}$2`);
        // Replace in CSS: fill:red -> fill:#newcolor
        const cssNameRegex = new RegExp(
          `((?:fill|stroke|stop-color|color)\\s*:\\s*)${name}([;}"\\s])`,
          "gi",
        );
        result = result.replace(cssNameRegex, `$1${replacement}$2`);
      }
    }

    // Replace rgb() equivalents
    const rDec = parseInt(original.slice(1, 3), 16);
    const gDec = parseInt(original.slice(3, 5), 16);
    const bDec = parseInt(original.slice(5, 7), 16);
    const rgbRegex = new RegExp(
      `rgb\\(\\s*${rDec}\\s*,\\s*${gDec}\\s*,\\s*${bDec}\\s*\\)`,
      "gi",
    );
    result = result.replace(rgbRegex, replacement);
  }

  return result;
}
