/**
 * Convertit un SVG en PNG et déclenche le téléchargement
 */
export async function downloadSvgAsPng(
  svgUrl: string,
  filename: string,
  size: number = 512,
): Promise<void> {
  try {
    // Fetch le SVG
    const response = await fetch(svgUrl);
    const svgText = await response.text();

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
    const response = await fetch(svgUrl);
    const svgText = await response.text();

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
 * Copie le code SVG dans le clipboard
 */
export async function copySvgCode(svgUrl: string): Promise<void> {
  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    await navigator.clipboard.writeText(svgText);
  } catch (error) {
    console.error("Error copying SVG code:", error);
    throw error;
  }
}
