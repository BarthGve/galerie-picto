import type { SvgMetadata } from "./svg-metadata";
import { enrichSvgWithMetadata } from "./svg-metadata";
import { API_URL } from "./config";

export interface UploadOptions {
  file: File;
  metadata: SvgMetadata;
  token: string;
  tags?: string[];
  galleryIds?: string[];
  contributor?: { githubUsername: string; githubAvatarUrl: string };
  onProgress?: (progress: number) => void;
}

/**
 * Upload un SVG vers le CDN Minio via presigned URL
 */
export async function uploadPictogram(
  options: UploadOptions,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const {
    file,
    metadata,
    token,
    tags = [],
    galleryIds = [],
    contributor,
    onProgress,
  } = options;

  try {
    // 1. Lire le fichier SVG
    const svgContent = await readFileAsText(file);

    // 2. Enrichir avec métadonnées
    const enrichedSvg = enrichSvgWithMetadata(svgContent, metadata);

    // 3. Demander une presigned URL à l'API
    onProgress?.(10);

    const urlResponse = await fetch(`${API_URL}/api/upload/presigned-url`, {
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

    // 5. Notifier le backend pour mettre à jour le manifest
    try {
      await notifyUploadComplete(token, {
        id: crypto.randomUUID(),
        filename: file.name,
        name: metadata.title || file.name.replace(/\.svg$/i, ""),
        url: publicUrl,
        size: file.size,
        category: metadata.category,
        tags,
        galleryIds,
        contributor,
      });
      onProgress?.(100);
    } catch (completeError) {
      // Ne pas bloquer si la notification échoue
      console.warn("Failed to notify upload complete:", completeError);
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
 * Notifie le backend qu'un upload est terminé pour mettre à jour le manifest
 */
async function notifyUploadComplete(
  token: string,
  data: {
    id: string;
    filename: string;
    name: string;
    url: string;
    size: number;
    category?: string;
    tags: string[];
    galleryIds: string[];
    contributor?: { githubUsername: string; githubAvatarUrl: string };
  },
): Promise<void> {
  const response = await fetch(`${API_URL}/api/upload/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to notify upload complete");
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
