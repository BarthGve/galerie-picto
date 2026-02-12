import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Copy,
  Check,
  Palette,
  Pencil,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Pictogram, Gallery } from "@/lib/types";
import { fetchSvgText } from "@/lib/svg-to-png";
import { usePictogramUrl } from "@/hooks/usePictogramUrl";
import { GallerySelector } from "./GallerySelector";
import { ColorCustomizer } from "./ColorCustomizer";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";

interface PictoModalProps {
  pictogram: Pictogram;
  isOpen: boolean;
  onClose: () => void;
  galleries?: Gallery[];
  onAddToGallery?: (galleryId: string, pictogramId: string) => Promise<boolean>;
  onRemoveFromGallery?: (
    galleryId: string,
    pictogramId: string,
  ) => Promise<boolean>;
  isAuthenticated?: boolean;
  onPictogramUpdated?: () => void;
  onDeletePictogram?: (id: string) => Promise<boolean>;
}

export function PictoModal({
  pictogram,
  isOpen,
  onClose,
  galleries,
  onAddToGallery,
  onRemoveFromGallery,
  isAuthenticated,
  onPictogramUpdated,
  onDeletePictogram,
}: PictoModalProps) {
  const [copied, setCopied] = useState(false);
  const [pngSize, setPngSize] = useState(512);
  const svgCacheRef = useRef<string | null>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const displayUrl = usePictogramUrl(pictogram);
  const [showColorCustomizer, setShowColorCustomizer] = useState(false);
  const [modifiedSvg, setModifiedSvg] = useState<string | null>(null);
  // Blob URL for the live preview when colors are modified
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Tag editing state
  const [editingTags, setEditingTags] = useState(false);
  const [tags, setTags] = useState<string[]>(pictogram.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    if (isOpen) {
      svgCacheRef.current = null;
      setSvgLoaded(false);
      setShowColorCustomizer(false);
      setModifiedSvg(null);
      setPreviewBlobUrl(null);
      setEditingTags(false);
      setTags(pictogram.tags || []);
      fetchSvgText(pictogram.url).then((text) => {
        svgCacheRef.current = text;
        setSvgLoaded(true);
      });
    }
  }, [isOpen, pictogram.url, pictogram.tags]);

  // Update blob URL when modifiedSvg changes for safe preview via <img>
  useEffect(() => {
    if (modifiedSvg) {
      const blob = new Blob([modifiedSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewBlobUrl(null);
  }, [modifiedSvg]);

  // The SVG to use for downloads/copy (modified if colors changed, original otherwise)
  const activeSvg = modifiedSvg || svgCacheRef.current;

  const handleCopy = async () => {
    if (!activeSvg) {
      toast.error("SVG en cours de chargement, réessayez");
      return;
    }
    try {
      await navigator.clipboard.writeText(activeSvg);
      setCopied(true);
      toast.success("Code SVG copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le code SVG");
    }
  };

  const handleDownloadSvg = () => {
    if (!activeSvg) return;
    const blob = new Blob([activeSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = pictogram.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = async () => {
    if (!activeSvg) return;
    try {
      const blob = new Blob([activeSvg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = pngSize;
      canvas.height = pngSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");
      ctx.clearRect(0, 0, pngSize, pngSize);
      ctx.drawImage(img, 0, 0, pngSize, pngSize);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = pngUrl;
        const baseName = pictogram.filename.replace(/\.svg$/i, "");
        link.download = `${baseName}-${pngSize}px.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      toast.error("Erreur lors de la conversion PNG");
    }
  };

  const handleModifiedSvgChange = useCallback((svg: string | null) => {
    setModifiedSvg(svg);
  }, []);

  // Tag editing handlers
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

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSaveTags = async () => {
    const token = getStoredToken();
    if (!token) return;

    setSavingTags(true);
    try {
      const response = await fetch(
        `${API_URL}/api/pictograms/${pictogram.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tags }),
        },
      );

      if (response.ok) {
        toast.success("Tags mis à jour");
        setEditingTags(false);
        onPictogramUpdated?.();
      } else {
        toast.error("Erreur lors de la mise à jour des tags");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSavingTags(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const showGallerySelector =
    isAuthenticated &&
    galleries &&
    galleries.length > 0 &&
    onAddToGallery &&
    onRemoveFromGallery;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pictogram.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
          {/* Left column - Preview + Color customization */}
          <div className="flex flex-col gap-4">
            {/* Live preview */}
            <div className="flex items-center justify-center bg-muted/30 rounded-lg py-12">
              <img
                src={previewBlobUrl || displayUrl}
                alt={pictogram.name}
                className="w-48 h-48 object-contain"
              />
            </div>

            {/* Contributor */}
            {pictogram.contributor && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <img
                  src={pictogram.contributor.githubAvatarUrl}
                  alt={pictogram.contributor.githubUsername}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-xs text-muted-foreground">Contributeur</p>
                  <p className="text-sm font-medium">
                    {pictogram.contributor.githubUsername}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Info & Actions */}
          <div className="flex flex-col gap-5">
            {/* Metadata */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nom du fichier</span>
                <p className="font-medium">{pictogram.filename}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <span className="text-muted-foreground">Taille</span>
                  <p className="font-medium">
                    {formatFileSize(pictogram.size)}
                  </p>
                </div>
                {pictogram.category && (
                  <div>
                    <span className="text-muted-foreground">Catégorie</span>
                    <p className="font-medium">{pictogram.category}</p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">
                  Dernière modification
                </span>
                <p className="font-medium">
                  {formatDate(pictogram.lastModified)}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Tags</span>
                {isAuthenticated && !editingTags && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setEditingTags(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {editingTags ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter un tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveTags}
                      disabled={savingTags}
                    >
                      {savingTags ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTags(false);
                        setTags(pictogram.tags || []);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(pictogram.tags?.length ?? 0) > 0 ? (
                    pictogram.tags!.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Aucun tag
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Color customizer */}
            {showColorCustomizer && svgCacheRef.current ? (
              <ColorCustomizer
                svgText={svgCacheRef.current}
                onModifiedSvgChange={handleModifiedSvgChange}
              />
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowColorCustomizer(true)}
                disabled={!svgLoaded}
                size="sm"
                className="w-full"
              >
                <Palette className="h-4 w-4 mr-2" />
                {svgLoaded
                  ? "Personnaliser les couleurs"
                  : "Chargement du SVG..."}
              </Button>
            )}

            {/* Gallery selector */}
            {showGallerySelector && (
              <GallerySelector
                galleries={galleries}
                pictogramId={pictogram.id}
                onAdd={onAddToGallery}
                onRemove={onRemoveFromGallery}
                variant="full"
              />
            )}

            {/* Delete action */}
            {isAuthenticated && onDeletePictogram && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Supprimer ce pictogramme ? Cette action est irréversible.",
                  );
                  if (!confirmed) return;
                  const success = await onDeletePictogram(pictogram.id);
                  if (success) {
                    toast.success("Pictogramme supprimé");
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}

            {/* Download actions - footer */}
            <div className="mt-auto space-y-3 pt-3 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadSvg}
                  disabled={!svgLoaded}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  SVG
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  disabled={!svgLoaded}
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <select
                  value={pngSize}
                  onChange={(e) => setPngSize(Number(e.target.value))}
                  className="flex h-10 w-24 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value={128}>128px</option>
                  <option value={256}>256px</option>
                  <option value={512}>512px</option>
                  <option value={1024}>1024px</option>
                </select>
                <Button
                  onClick={handleDownloadPng}
                  variant="secondary"
                  disabled={!svgLoaded}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PNG ({pngSize}px)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
