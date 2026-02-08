export interface Pictogram {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
  lastModified: string;
  category?: string;
  tags?: string[];
  galleryIds?: string[];
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
  icon?: string;
  pictogramIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleriesFile {
  galleries: Gallery[];
  lastUpdated: string;
}
