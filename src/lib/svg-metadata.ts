export interface SvgMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
}

/**
 * Enrichit un SVG avec des métadonnées si elles n'existent pas déjà
 */
export function enrichSvgWithMetadata(
  svgContent: string,
  metadata: SvgMetadata,
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");

    // Vérifier qu'il n'y a pas d'erreur de parsing
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Invalid SVG file");
    }

    const svgElement = doc.querySelector("svg");
    if (!svgElement) {
      throw new Error("No SVG element found");
    }

    // Ajouter <title> si absent et fourni
    if (metadata.title && !doc.querySelector("title")) {
      const titleElement = doc.createElement("title");
      titleElement.textContent = metadata.title;
      svgElement.insertBefore(titleElement, svgElement.firstChild);
    }

    // Ajouter <desc> si absent et fourni
    if (metadata.description && !doc.querySelector("desc")) {
      const descElement = doc.createElement("desc");
      descElement.textContent = metadata.description;
      // Insérer après title si existe, sinon au début
      const titleElement = doc.querySelector("title");
      if (titleElement && titleElement.nextSibling) {
        svgElement.insertBefore(descElement, titleElement.nextSibling);
      } else {
        svgElement.insertBefore(descElement, svgElement.firstChild);
      }
    }

    // Ajouter attributs data-* sur l'élément SVG
    if (metadata.category) {
      svgElement.setAttribute("data-category", metadata.category);
    }

    if (metadata.tags && metadata.tags.length > 0) {
      svgElement.setAttribute("data-tags", metadata.tags.join(","));
    }

    if (metadata.author) {
      svgElement.setAttribute("data-author", metadata.author);
    }

    // Toujours ajouter la date d'upload
    svgElement.setAttribute("data-upload-date", new Date().toISOString());

    // Sérialiser le SVG modifié
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (error) {
    console.error("Error enriching SVG:", error);
    throw error;
  }
}

/**
 * Extrait les métadonnées existantes d'un SVG
 */
export function extractSvgMetadata(svgContent: string): SvgMetadata {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");

    const svgElement = doc.querySelector("svg");
    if (!svgElement) {
      return {};
    }

    const title = doc.querySelector("title")?.textContent || undefined;
    const description = doc.querySelector("desc")?.textContent || undefined;
    const category = svgElement.getAttribute("data-category") || undefined;
    const tagsStr = svgElement.getAttribute("data-tags");
    const tags = tagsStr ? tagsStr.split(",") : undefined;
    const author = svgElement.getAttribute("data-author") || undefined;

    return {
      title,
      description,
      category,
      tags,
      author,
    };
  } catch (error) {
    console.error("Error extracting SVG metadata:", error);
    return {};
  }
}

/**
 * Valide qu'un fichier est bien un SVG
 */
export function validateSvgFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (!file.type.includes("svg")) {
      resolve(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "image/svg+xml");
        const parserError = doc.querySelector("parsererror");
        resolve(!parserError && !!doc.querySelector("svg"));
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}
