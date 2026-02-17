// Types pour la galerie de pictogrammes

export interface Contributor {
  githubUsername: string;
  githubAvatarUrl: string;
}

export interface Pictogram {
  id: string;
  name: string;
  filename: string;
  url: string;
  // darkUrl est calculé côté client par pairDarkVariants() et non stocké dans le manifest
  darkUrl?: string;
  size: number;
  lastModified: string;
  tags?: string[];
  galleryIds?: string[];
  contributor?: Contributor;
}

export interface PictogramManifest {
  pictograms: Pictogram[];
  lastUpdated: string;
  totalCount: number;
}

export interface Gallery {
  id: string;
  name: string;
  description?: string;
  color?: string;
  pictogramIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleriesFile {
  galleries: Gallery[];
  lastUpdated: string;
}

export interface DownloadOptions {
  format: "svg" | "png";
  size?: number; // Pour PNG uniquement
}
