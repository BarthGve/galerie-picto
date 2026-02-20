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
): Promise<{ success: boolean; url?: string; pictogramId?: string; error?: string }> {
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

    // 3. Upload le SVG enrichi via le backend (évite les problèmes CORS du CDN)
    onProgress?.(10);

    const uploadResponse = await fetch(`${API_URL}/api/upload/file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        content: enrichedSvg,
      }),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || "Failed to upload file");
    }

    const { publicUrl } = await uploadResponse.json();

    onProgress?.(70);

    const pictogramId = crypto.randomUUID();

    // 5. Notifier le backend pour mettre à jour le manifest
    try {
      await notifyUploadComplete(token, {
        id: pictogramId,
        filename: file.name,
        name: metadata.title || file.name.replace(/\.svg$/i, ""),
        url: publicUrl,
        size: file.size,
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
      pictogramId,
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
