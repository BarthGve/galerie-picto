import { useState } from "react";
import { Upload } from "lucide-react";
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

interface UploadDialogProps {
  onUploadSuccess?: () => void;
}

export function UploadDialog({ onUploadSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SvgMetadata>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
    };
    reader.readAsText(selectedFile);
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
          author: "Bruno",
        },
        token,
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
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Ajouter un pictogramme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📤 Ajouter un pictogramme</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium mb-2">
              📁 Fichier SVG
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
              <label className="block text-sm font-medium mb-2">
                👁️ Preview
              </label>
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
              <label className="block text-sm font-medium">
                📝 Métadonnées (si absentes du SVG)
              </label>

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

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Tags (séparés par virgule)
                </label>
                <Input
                  placeholder="Ex: gendarmerie, officiel, logo"
                  value={metadata.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    })
                  }
                  disabled={uploading}
                />
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                ℹ️ Ces métadonnées seront ajoutées au SVG si elles n'existent
                pas déjà
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
