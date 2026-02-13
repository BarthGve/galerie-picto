import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

// Only allow safe SVG elements and attributes
purify.setConfig({
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: ["use"],
  FORBID_TAGS: ["script", "foreignObject", "iframe", "object", "embed"],
  FORBID_ATTR: [
    "onload",
    "onerror",
    "onclick",
    "onmouseover",
    "onfocus",
    "onblur",
    "onanimationstart",
    "onanimationend",
  ],
});

const FILENAME_RE = /^[a-zA-Z0-9àâäéèêëïîôùûüÿçœæ _\-().]+\.svg$/i;
const MAX_SVG_SIZE = 1_048_576; // 1 MB

export function sanitizeSvg(content: string): string {
  return purify.sanitize(content);
}

export function isValidSvgFilename(filename: string): boolean {
  return FILENAME_RE.test(filename) && !filename.includes("..");
}

export function isValidSvgContent(content: string): boolean {
  if (content.length > MAX_SVG_SIZE) return false;
  return content.trimStart().startsWith("<") && content.includes("<svg");
}
