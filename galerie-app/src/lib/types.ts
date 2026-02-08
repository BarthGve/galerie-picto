// Types pour la galerie de pictogrammes

export interface Pictogram {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
  lastModified: string;
  category?: string;
  tags?: string[];
}

export interface PictogramManifest {
  pictograms: Pictogram[];
  lastUpdated: string;
  totalCount: number;
}

export interface DownloadOptions {
  format: "svg" | "png";
  size?: number; // Pour PNG uniquement
}
