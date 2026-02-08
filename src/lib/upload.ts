import type { SvgMetadata } from "./svg-metadata";
import { enrichSvgWithMetadata } from "./svg-metadata";

export interface UploadOptions {
  file: File;
  metadata: SvgMetadata;
  token: string;
  onProgress?: (progress: number) => void;
}

/**
 * Upload un SVG vers le CDN Minio via presigned URL
 */
export async function uploadPictogram(
  options: UploadOptions,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { file, metadata, token, onProgress } = options;

  try {
    // 1. Lire le fichier SVG
    const svgContent = await readFileAsText(file);

    // 2. Enrichir avec métadonnées
    const enrichedSvg = enrichSvgWithMetadata(svgContent, metadata);

    // 3. Demander une presigned URL à l'API
    onProgress?.(10);

    const urlResponse = await fetch("/api/upload/presigned-url", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: "image/svg+xml",
      }),
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { uploadUrl, publicUrl } = await urlResponse.json();

    onProgress?.(30);

    // 4. Upload le SVG enrichi vers Minio
    const blob = new Blob([enrichedSvg], { type: "image/svg+xml" });

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": "image/svg+xml",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    onProgress?.(70);

    // 5. Déclencher le workflow GitHub pour régénérer la galerie
    try {
      await triggerGalleryUpdate(token);
      onProgress?.(100);
    } catch (workflowError) {
      // Ne pas bloquer si le workflow ne se déclenche pas
      console.warn("Failed to trigger gallery update:", workflowError);
      onProgress?.(100);
    }

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Déclenche le workflow GitHub pour mettre à jour la galerie
 */
async function triggerGalleryUpdate(token: string): Promise<void> {
  const response = await fetch("/api/trigger-update", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to trigger gallery update");
  }
}

// Helper pour lire un fichier comme texte
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
