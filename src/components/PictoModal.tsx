import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Download,
  Copy,
  Check,
  Lock,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Pictogram, Gallery } from "@/lib/types";
import { fetchSvgText } from "@/lib/svg-to-png";
import { usePictogramUrl } from "@/hooks/usePictogramUrl";
import { GallerySelector } from "./GallerySelector";
import { UpgradeGateDialog } from "./UpgradeGateDialog";
import { toast } from "sonner";

const ColorCustomizer = lazy(() =>
  import("./ColorCustomizer").then((m) => ({ default: m.ColorCustomizer })),
);
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import { useDownloads } from "@/hooks/useDownloads";

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
  user?: { login: string; avatar_url: string } | null;
  onPictogramUpdated?: () => void;
  onDeletePictogram?: (id: string) => Promise<boolean>;
  onLogin?: () => void;
}

export function PictoModal({
  pictogram,
  isOpen,
  onClose,
  galleries,
  onAddToGallery,
  onRemoveFromGallery,
  isAuthenticated,
  user,
  onPictogramUpdated,
  onDeletePictogram,
  onLogin,
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

  // Name editing state
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(
    pictogram.name || pictogram.filename.replace(/\.svg$/i, ""),
  );
  const [savingName, setSavingName] = useState(false);

  // Contributor editing state
  const [savingContributor, setSavingContributor] = useState(false);

  // Downloads tracking
  const { trackDownload, getCount } = useDownloads();
  const downloadCount = getCount(pictogram.id);

  // Upgrade gate for anonymous users
  const [upgradeGateOpen, setUpgradeGateOpen] = useState(false);

  // Anonymous PNG download via server endpoint
  const [anonDownloadsRemaining, setAnonDownloadsRemaining] = useState<
    number | null
  >(null);

  // Check remaining downloads for anonymous on modal open
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      fetch(`${API_URL}/api/pictograms/downloads/remaining`)
        .then((res) => res.json())
        .then((data) => setAnonDownloadsRemaining(data.remaining ?? null))
        .catch(() => {});
    }
  }, [isOpen, isAuthenticated]);

  const handleDownloadPngAnonymous = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/pictograms/${pictogram.id}/download-png`,
        { method: "POST" },
      );
      if (res.status === 403) {
        setAnonDownloadsRemaining(0);
        setUpgradeGateOpen(true);
        return;
      }
      if (!res.ok) {
        toast.error("Erreur lors du téléchargement");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const baseName = pictogram.filename.replace(/\.svg$/i, "");
      link.download = `${baseName}-256px.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update remaining count
      const remaining = res.headers.get("X-Downloads-Remaining");
      if (remaining !== null) {
        setAnonDownloadsRemaining(parseInt(remaining, 10));
      }

      toast.success(
        "Pictogramme téléchargé ! Connectez-vous pour des téléchargements illimités.",
      );
    } catch {
      toast.error("Erreur réseau");
    }
  };

  useEffect(() => {
    if (isOpen) {
      svgCacheRef.current = null;
      setSvgLoaded(false);
      setShowColorCustomizer(false);
      setModifiedSvg(null);
      setPreviewBlobUrl(null);
      setEditingTags(false);
      setTags(pictogram.tags || []);
      setEditingName(false);
      setName(pictogram.name || pictogram.filename.replace(/\.svg$/i, ""));
      fetchSvgText(pictogram.url).then((text) => {
        svgCacheRef.current = text;
        setSvgLoaded(true);
      });
    }
  }, [
    isOpen,
    pictogram.url,
    pictogram.tags,
    pictogram.name,
    pictogram.filename,
  ]);

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
    trackDownload(pictogram.id);
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
        trackDownload(pictogram.id);
      }, "image/png");
    } catch {
      toast.error("Erreur lors de la conversion PNG");
    }
  };

  const handleModifiedSvgChange = useCallback((svg: string | null) => {
    setModifiedSvg(svg);
  }, []);

  // Name editing handlers
  const handleSaveName = async () => {
    const token = getStoredToken();
    if (!token) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Le titre ne peut pas être vide");
      return;
    }

    setSavingName(true);
    try {
      const response = await fetch(
        `${API_URL}/api/pictograms/${pictogram.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        },
      );

      if (response.ok) {
        toast.success("Titre mis à jour");
        setEditingName(false);
        onPictogramUpdated?.();
      } else {
        toast.error("Erreur lors de la mise à jour du titre");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSavingName(false);
    }
  };

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

  const handleSetContributor = async () => {
    if (!user) return;
    const token = getStoredToken();
    if (!token) return;

    setSavingContributor(true);
    try {
      const response = await fetch(
        `${API_URL}/api/pictograms/${pictogram.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contributor: {
              githubUsername: user.login,
              githubAvatarUrl: user.avatar_url,
            },
          }),
        },
      );

      if (response.ok) {
        toast.success("Contributeur mis à jour");
        onPictogramUpdated?.();
      } else {
        toast.error("Erreur lors de la mise à jour du contributeur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSavingContributor(false);
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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={savingName}
                  className="h-8 text-lg font-semibold"
                  placeholder="Titre du pictogramme"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveName}
                  disabled={savingName || !name.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingName(false);
                    setName(
                      pictogram.name ||
                        pictogram.filename.replace(/\.svg$/i, ""),
                    );
                  }}
                  disabled={savingName}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <DialogTitle className="text-lg font-bold text-gradient-primary">
                  {pictogram.name || pictogram.filename.replace(/\.svg$/i, "")}
                </DialogTitle>
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setEditingName(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            {isAuthenticated && onDeletePictogram && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Supprimer ce pictogramme ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le pictogramme sera
                      supprimé définitivement du CDN et de toutes les galeries.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={async () => {
                        const success = await onDeletePictogram(pictogram.id);
                        if (success) {
                          toast.success("Pictogramme supprimé");
                          onClose();
                        }
                      }}
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
          {/* Left column - Preview + Color customization */}
          <div className="flex flex-col gap-4">
            {/* Live preview */}
            <div className="flex items-center justify-center rounded-2xl py-12">
              <img
                src={previewBlobUrl || displayUrl}
                alt={
                  pictogram.name || pictogram.filename.replace(/\.svg$/i, "")
                }
                className="w-48 h-48 object-contain drop-shadow-sm"
              />
            </div>

            {/* Contributor */}
            {pictogram.contributor ? (
              <div className="flex items-center gap-3 p-3 bg-accent rounded-2xl border border-border">
                <img
                  src={pictogram.contributor.githubAvatarUrl}
                  alt={pictogram.contributor.githubUsername}
                  className="w-8 h-8 rounded-full ring-2 ring-ring-accent"
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Contributeur</p>
                  <p className="text-sm font-medium text-foreground">
                    {pictogram.contributor.githubUsername}
                  </p>
                </div>
                {isAuthenticated &&
                  user &&
                  pictogram.contributor.githubUsername !== user.login && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs hover:text-primary"
                      disabled={savingContributor}
                      onClick={handleSetContributor}
                    >
                      Me définir
                    </Button>
                  )}
              </div>
            ) : isAuthenticated && user ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                disabled={savingContributor}
                onClick={handleSetContributor}
              >
                {savingContributor
                  ? "Enregistrement..."
                  : "Me définir comme contributeur"}
              </Button>
            ) : null}
          </div>

          {/* Right column - Info & Actions */}
          <div className="flex flex-col gap-5">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-surface-subtle rounded-2xl border border-border p-4">
              <div>
                <span className="text-xs text-muted-foreground">Fichier</span>
                <p className="font-medium text-foreground truncate">{pictogram.filename}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Taille</span>
                <p className="font-medium text-foreground">
                  {formatFileSize(pictogram.size)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Modifié le
                </span>
                <p className="font-medium text-foreground">
                  {formatDate(pictogram.lastModified)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Téléchargements</span>
                <p className="font-medium text-badge-download-text">
                  {downloadCount}
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
                      className="h-8 text-sm rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      className="h-8 rounded-lg"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-badge-bg border-badge-border text-badge-text gap-1">
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
                      className="rounded-lg"
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
                      className="rounded-lg"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(pictogram.tags?.length ?? 0) > 0 ? (
                    pictogram.tags!.map((tag) => (
                      <Badge key={tag} variant="outline" className="bg-badge-bg border-badge-border text-badge-text">
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
            {isAuthenticated ? (
              showColorCustomizer && svgCacheRef.current ? (
                <Suspense
                  fallback={
                    <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
                      Chargement...
                    </div>
                  }
                >
                  <ColorCustomizer
                    svgText={svgCacheRef.current}
                    onModifiedSvgChange={handleModifiedSvgChange}
                  />
                </Suspense>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowColorCustomizer(true)}
                  disabled={!svgLoaded}
                  size="sm"
                  className="w-full rounded-xl border-border hover:bg-accent hover:text-primary"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  {svgLoaded
                    ? "Personnaliser les couleurs"
                    : "Chargement du SVG..."}
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                onClick={() => setUpgradeGateOpen(true)}
                size="sm"
                className="w-full rounded-xl border-border"
              >
                <Lock className="h-4 w-4 mr-2" />
                Personnaliser les couleurs
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

            {/* Download actions - footer */}
            <div className="mt-auto space-y-3 pt-4 border-t border-border">
              {isAuthenticated ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownloadSvg}
                      disabled={!svgLoaded}
                      className="flex-1 rounded-xl btn-cta"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      SVG
                    </Button>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      disabled={!svgLoaded}
                      className="flex-1 rounded-xl border-border"
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
                      className="flex h-10 w-24 items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className="flex-1 rounded-xl"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PNG ({pngSize}px)
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setUpgradeGateOpen(true)}
                      variant="outline"
                      className="flex-1 rounded-xl border-border"
                      disabled
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      SVG
                    </Button>
                    <Button
                      onClick={() => setUpgradeGateOpen(true)}
                      variant="outline"
                      className="flex-1 rounded-xl border-border"
                      disabled
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Copier
                    </Button>
                  </div>

                  <Button
                    onClick={handleDownloadPngAnonymous}
                    variant="secondary"
                    className="w-full rounded-xl"
                    disabled={anonDownloadsRemaining === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PNG (256px)
                    {anonDownloadsRemaining !== null && anonDownloadsRemaining > 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({anonDownloadsRemaining} restant{anonDownloadsRemaining > 1 ? "s" : ""})
                      </span>
                    )}
                  </Button>
                  {anonDownloadsRemaining === 0 ? (
                    <p className="text-xs text-center text-muted-foreground">
                      Limite atteinte.{" "}
                      <button
                        className="text-primary hover:underline font-medium"
                        onClick={() => setUpgradeGateOpen(true)}
                      >
                        Connectez-vous
                      </button>{" "}
                      pour des téléchargements illimités.
                    </p>
                  ) : (
                    <p className="text-xs text-center text-muted-foreground">
                      Connectez-vous pour télécharger en SVG et choisir la taille
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {onLogin && (
        <UpgradeGateDialog
          open={upgradeGateOpen}
          onOpenChange={setUpgradeGateOpen}
          onLogin={onLogin}
        />
      )}
    </Dialog>
  );
}
