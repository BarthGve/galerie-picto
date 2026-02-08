import { useState, useEffect } from "react";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoredToken, isAuthenticated } from "@/lib/github-auth";
import {
  validateSvgFile,
  extractSvgMetadata,
  type SvgMetadata,
} from "@/lib/svg-metadata";
import { uploadPictogram } from "@/lib/upload";
import { API_URL } from "@/lib/config";
import type { Gallery } from "@/lib/types";

interface UploadDialogProps {
  onUploadSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UploadDialog({
  onUploadSuccess,
  open: controlledOpen,
  onOpenChange,
}: UploadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SvgMetadata>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Galleries state
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [loadingGalleries, setLoadingGalleries] = useState(false);

  // Inline gallery creation
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState("");
  const [newGalleryColor, setNewGalleryColor] = useState("#6366f1");
  const [creatingGallery, setCreatingGallery] = useState(false);

  // Fetch galleries when dialog opens
  useEffect(() => {
    if (open) {
      fetchGalleries();
    }
  }, [open]);

  const fetchGalleries = async () => {
    setLoadingGalleries(true);
    try {
      const response = await fetch(`${API_URL}/api/galleries`);
      if (response.ok) {
        const data = await response.json();
        setGalleries(data.galleries || []);
      }
    } catch (error) {
      console.error("Failed to fetch galleries:", error);
    } finally {
      setLoadingGalleries(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Valider le fichier
    const isValid = await validateSvgFile(selectedFile);
    if (!isValid) {
      toast.error("Le fichier doit être un SVG valide");
      return;
    }

    setFile(selectedFile);

    // Créer preview URL sécurisée
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Extraire métadonnées existantes
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const existing = extractSvgMetadata(content);
      setMetadata(existing);
      // Pre-fill tags from existing SVG metadata
      if (existing.tags && existing.tags.length > 0) {
        setTags(existing.tags);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleGallery = (galleryId: string) => {
    setSelectedGalleryIds((prev) =>
      prev.includes(galleryId)
        ? prev.filter((id) => id !== galleryId)
        : [...prev, galleryId],
    );
  };

  const handleCreateGallery = async () => {
    const name = newGalleryName.trim();
    if (!name) return;

    const token = getStoredToken();
    if (!token) return;

    setCreatingGallery(true);
    try {
      const response = await fetch(`${API_URL}/api/galleries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          color: newGalleryColor,
        }),
      });

      if (response.ok) {
        const created = await response.json();
        setGalleries((prev) => [...prev, created]);
        setSelectedGalleryIds((prev) => [...prev, created.id]);
        setNewGalleryName("");
        setNewGalleryColor("#6366f1");
        setShowNewGallery(false);
        toast.success(`Galerie "${name}" créée`);
      } else {
        const err = await response.json();
        toast.error(err.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Failed to create gallery:", error);
      toast.error("Erreur lors de la création de la galerie");
    } finally {
      setCreatingGallery(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const token = getStoredToken();
    if (!token) {
      toast.error("Vous devez être connecté pour uploader");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadPictogram({
        file,
        metadata: {
          ...metadata,
          tags,
          author: "Bruno",
        },
        token,
        tags,
        galleryIds: selectedGalleryIds,
        onProgress: setProgress,
      });

      if (result.success) {
        toast.success(
          "Pictogramme uploadé avec succès ! La galerie se met à jour...",
          {
            duration: 5000,
          },
        );
        setOpen(false);
        resetForm();
        onUploadSuccess?.();
      } else {
        toast.error(result.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setMetadata({});
    setProgress(0);
    setTags([]);
    setTagInput("");
    setSelectedGalleryIds([]);
    setShowNewGallery(false);
    setNewGalleryName("");
    setNewGalleryColor("#6366f1");
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Ajouter un pictogramme
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un pictogramme</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Fichier SVG
            </label>
            <Input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <Badge variant="secondary" className="mt-2">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Badge>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div>
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center h-48">
                <img
                  src={previewUrl}
                  alt="SVG preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Métadonnées */}
          {file && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Métadonnées</label>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Titre
                </label>
                <Input
                  placeholder="Nom du pictogramme"
                  value={metadata.title || ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, title: e.target.value })
                  }
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Description
                </label>
                <Input
                  placeholder="Description du pictogramme"
                  value={metadata.description || ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, description: e.target.value })
                  }
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Catégorie
                </label>
                <Input
                  placeholder="Ex: logos, icons, illustrations"
                  value={metadata.category || ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, category: e.target.value })
                  }
                  disabled={uploading}
                />
              </div>

              {/* Tags - chips UI */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Tags / Mots-clés
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={uploading || !tagInput.trim()}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-0.5 hover:text-destructive"
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery selection */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Galeries
                </label>
                {loadingGalleries ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des galeries...
                  </div>
                ) : galleries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Aucune galerie disponible
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-md p-2">
                    {galleries.map((gallery) => (
                      <label
                        key={gallery.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGalleryIds.includes(gallery.id)}
                          onChange={() => handleToggleGallery(gallery.id)}
                          disabled={uploading}
                          className="rounded border-input"
                        />
                        <span className="text-sm">{gallery.name}</span>
                        {gallery.color && (
                          <span
                            className="inline-block w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: gallery.color }}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Inline new gallery form */}
                {!showNewGallery ? (
                  <button
                    type="button"
                    onClick={() => setShowNewGallery(true)}
                    className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                    disabled={uploading}
                  >
                    <Plus className="h-3 w-3" />
                    Créer une galerie
                  </button>
                ) : (
                  <div className="mt-2 border rounded-md p-3 space-y-2 bg-muted/20">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nom de la galerie"
                        value={newGalleryName}
                        onChange={(e) => setNewGalleryName(e.target.value)}
                        disabled={creatingGallery}
                        className="text-sm"
                      />
                      <Input
                        type="color"
                        value={newGalleryColor}
                        onChange={(e) => setNewGalleryColor(e.target.value)}
                        disabled={creatingGallery}
                        className="w-12 p-1 h-9 cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewGallery(false);
                          setNewGalleryName("");
                          setNewGalleryColor("#6366f1");
                        }}
                        disabled={creatingGallery}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateGallery}
                        disabled={creatingGallery || !newGalleryName.trim()}
                      >
                        {creatingGallery ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        Créer
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                Les métadonnées seront ajoutées au SVG si elles n'existent pas
                déjà. Les galeries et tags sont optionnels.
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload en cours...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Upload..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
