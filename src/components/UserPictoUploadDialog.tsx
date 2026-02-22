import { useState, useRef, useCallback } from "react";
import { Upload, X, Plus, Loader2, FileUp, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoredToken } from "@/lib/github-auth";
import { validateSvgFile } from "@/lib/svg-metadata";
import { API_URL } from "@/lib/config";
import { useTheme } from "@/hooks/use-theme";
import { transformSvgToDark } from "@/lib/svg-dark-transform";
import type { UserCollection } from "@/lib/types";

interface UserPictoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId?: string;
  collectionName?: string;
  collections?: UserCollection[];
  onUploadSuccess: () => Promise<void>;
}

export function UserPictoUploadDialog({
  open,
  onOpenChange,
  collectionId: collectionIdProp,
  collectionName: collectionNameProp,
  collections,
  onUploadSuccess,
}: UserPictoUploadDialogProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const skipStep1 = !!collectionIdProp;
  const [step, setStep] = useState<1 | 2>(skipStep1 ? 2 : 1);
  const [pickedCollectionId, setPickedCollectionId] = useState<string | null>(null);
  const [pickedCollectionName, setPickedCollectionName] = useState<string | null>(null);

  const collectionId = collectionIdProp ?? pickedCollectionId ?? "";
  const collectionName = collectionNameProp ?? pickedCollectionName ?? "";

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [darkPreviewUrl, setDarkPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (selectedFile: File) => {
    const isValid = await validateSvgFile(selectedFile);
    if (!isValid) {
      toast.error("Le fichier doit être un SVG valide");
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setName(selectedFile.name.replace(/\.svg$/i, ""));
    // Préparation de la preview dark mode
    selectedFile.text().then((svgText) => {
      const darkBlob = new Blob([transformSvgToDark(svgText)], { type: "image/svg+xml" });
      setDarkPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(darkBlob); });
    }).catch(() => { /* silently fail — light preview reste disponible */ });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await processFile(f);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) await processFile(f);
    },
    [processFile],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) return;

    const token = getStoredToken();
    if (!token) {
      toast.error("Vous devez être connecté");
      return;
    }

    setUploading(true);
    try {
      const content = await file.text();

      const res = await fetch(`${API_URL}/api/user/pictograms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          content,
          name: name.trim(),
          collectionId,
          tags,
        }),
      });

      if (res.status === 507) {
        toast.error("Quota de stockage dépassé (5 Mo)");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erreur lors de l'upload");
        return;
      }

      toast.success(`SVG ajouté à « ${collectionName} »`);
      onOpenChange(false);
      resetForm();
      await onUploadSuccess();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (darkPreviewUrl) URL.revokeObjectURL(darkPreviewUrl);
    setFile(null);
    setPreviewUrl(null);
    setDarkPreviewUrl(null);
    setName("");
    setTags([]);
    setTagInput("");
    if (!skipStep1) {
      setStep(1);
      setPickedCollectionId(null);
      setPickedCollectionName(null);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const handlePickCollection = (col: UserCollection) => {
    setPickedCollectionId(col.id);
    setPickedCollectionName(col.name);
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-[4px] border-border" aria-describedby={step === 1 ? undefined : undefined}>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-tertiary">Choisir une collection</DialogTitle>
              <DialogDescription>
                Dans quelle collection souhaitez-vous ajouter votre SVG ?
              </DialogDescription>
            </DialogHeader>

            {collections && collections.length > 0 ? (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handlePickCollection(col)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border border-border"
                      style={{ backgroundColor: col.color ?? "#6a6af4" }}
                    />
                    <span className="flex-1 text-sm font-medium truncate">{col.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {col.pictogramIds.length + col.userPictogramIds.length} picto{(col.pictogramIds.length + col.userPictogramIds.length) !== 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Aucune collection. Créez-en une depuis le menu latéral.
              </p>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleClose(false)} className="rounded-[4px]">
                Annuler
              </Button>
            </div>
          </>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle className="text-tertiary">
            Ajouter un SVG perso
            <span className="text-sm font-normal text-muted-foreground ml-2">
              → {collectionName}
            </span>
          </DialogTitle>
        </DialogHeader>

        {!skipStep1 && (
          <button
            type="button"
            onClick={handleBackToStep1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-2 mb-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Changer de collection
          </button>
        )}

        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded transition-colors cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <FileUp className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Glisser-déposer un SVG</p>
              <p className="text-xs text-muted-foreground mt-1">ou cliquer pour parcourir</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-4 p-3 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <img
                src={(isDark && darkPreviewUrl) ? darkPreviewUrl : previewUrl!}
                alt="Aperçu"
                className="w-14 h-14 object-contain shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB — SVG privé
                </p>
                <p className="text-xs text-primary mt-0.5">Cliquer pour remplacer</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Titre *</label>
              <Input
                placeholder="Nom du pictogramme"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={uploading}
                className="rounded-[4px]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter un tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={uploading}
                  className="rounded-[4px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={uploading || !tagInput.trim()}
                  className="shrink-0 h-9 rounded-[4px]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="hover:text-destructive"
                        disabled={uploading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
              Ce SVG sera <strong>privé</strong> — visible uniquement par vous.
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={uploading}
                className="rounded-[4px]"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || !name.trim() || uploading}
                className="rounded-[4px]"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Upload..." : "Ajouter"}
              </Button>
            </div>
          </div>
        )}

        {!file && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => handleClose(false)} className="rounded-[4px]">
              Annuler
            </Button>
          </div>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
