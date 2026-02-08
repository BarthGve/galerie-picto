import { API_URL } from "@/lib/config";

/**
 * Fetch le contenu SVG en passant par le proxy backend
 * pour contourner le double header CORS du CDN
 */
async function fetchSvgText(svgUrl: string): Promise<string> {
  const proxyUrl = `${API_URL}/api/proxy/svg?url=${encodeURIComponent(svgUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  return response.text();
}

/**
 * Convertit un SVG en PNG et déclenche le téléchargement
 */
export async function downloadSvgAsPng(
  svgUrl: string,
  filename: string,
  size: number = 512,
): Promise<void> {
  try {
    // Fetch le SVG via proxy
    const svgText = await fetchSvgText(svgUrl);

    // Créer un blob SVG
    const svgBlob = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl2 = URL.createObjectURL(svgBlob);

    // Créer une image
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = svgUrl2;
    });

    // Créer un canvas
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Dessiner l'image sur le canvas avec fond transparent
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    // Convertir en PNG et télécharger
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("Could not create PNG blob");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename.replace(".svg", "")}-${size}px.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(svgUrl2);
    }, "image/png");
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    throw error;
  }
}

/**
 * Télécharge le SVG directement
 */
export async function downloadSvg(
  svgUrl: string,
  filename: string,
): Promise<void> {
  try {
    const svgText = await fetchSvgText(svgUrl);

    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading SVG:", error);
    throw error;
  }
}

/**
 * Copie du texte dans le clipboard via un textarea caché (fallback universel)
 */
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}

/**
 * Copie le code SVG dans le clipboard
 */
export async function copySvgCode(svgUrl: string): Promise<void> {
  const svgText = await fetchSvgText(svgUrl);

  // Essayer l'API Clipboard moderne
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(svgText);
      return;
    } catch {
      // Le navigateur a bloqué - fallback ci-dessous
    }
  }

  // Fallback execCommand
  if (!fallbackCopy(svgText)) {
    throw new Error("Impossible de copier dans le presse-papier");
  }
}
