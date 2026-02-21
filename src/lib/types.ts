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

export interface UserCollection {
  id: string;
  userLogin: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
  createdAt: string | null;
  updatedAt: string | null;
  pictogramIds: string[];
  userPictogramIds: string[];
}

export interface UserPictogram {
  id: string;
  ownerLogin: string;
  name: string;
  filename: string;
  size: number;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DownloadOptions {
  format: "svg" | "png";
  size?: number; // Pour PNG uniquement
}

export type PictoRequestStatus =
  | "nouvelle"
  | "en_cours"
  | "precisions_requises"
  | "livree"
  | "refusee";

export interface PictoRequest {
  id: string;
  requesterLogin: string;
  requesterName: string | null;
  requesterAvatar: string | null;
  title: string;
  description: string;
  referenceImageKey: string | null;
  referenceImageUrl: string | null;
  urgency: string;
  status: PictoRequestStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  assignedToAvatar: string | null;
  deliveredPictogramId: string | null;
  deliveredPictogramUrl: string | null;
  rejectionReason: string | null;
  commentCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PictoRequestComment {
  id: string;
  requestId: string;
  authorLogin: string;
  authorName: string | null;
  authorAvatar: string | null;
  content: string;
  createdAt: string | null;
}

export interface AppNotification {
  id: string;
  recipientLogin: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: number;
  createdAt: string | null;
}
