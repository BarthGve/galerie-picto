import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, X, Plus, Loader2, FileUp, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  user?: { login: string; avatar_url: string } | null;
}

export function UploadDialog({
  onUploadSuccess,
  open: controlledOpen,
  onOpenChange,
  user,
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
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryDropdownOpen, setGalleryDropdownOpen] = useState(false);

  // Contributor state
  const [contributorUsername, setContributorUsername] = useState("");
  const [contributorAvatar, setContributorAvatar] = useState<string | null>(
    null,
  );
  const [teamMembers, setTeamMembers] = useState<
    { login: string; avatar_url: string }[]
  >([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Inline gallery creation
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState("");
  const [newGalleryColor, setNewGalleryColor] = useState("#6366f1");
  const [creatingGallery, setCreatingGallery] = useState(false);

  // Fetch galleries and team when dialog opens
  useEffect(() => {
    if (open) {
      fetchGalleries();
      fetchTeam();
    }
  }, [open]);

  // Auto-select current user as contributor
  useEffect(() => {
    if (open && user && !contributorUsername) {
      setContributorUsername(user.login);
      setContributorAvatar(user.avatar_url);
    }
  }, [open, user, contributorUsername]);

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
      toast.error("Impossible de charger les galeries");
    } finally {
      setLoadingGalleries(false);
    }
  };

  const fetchTeam = async () => {
    const token = getStoredToken();
    if (!token) return;

    setLoadingTeam(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleSelectContributor = (login: string, avatar_url: string) => {
    if (contributorUsername === login) {
      setContributorUsername("");
      setContributorAvatar(null);
    } else {
      setContributorUsername(login);
      setContributorAvatar(avatar_url);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const galleryDropdownRef = useRef<HTMLDivElement>(null);

  // Close gallery dropdown on outside click
  useEffect(() => {
    if (!galleryDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        galleryDropdownRef.current &&
        !galleryDropdownRef.current.contains(e.target as Node)
      ) {
        setGalleryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [galleryDropdownOpen]);

  const processFile = useCallback(
    async (selectedFile: File) => {
      const isValid = await validateSvgFile(selectedFile);
      if (!isValid) {
        toast.error("Le fichier doit être un SVG valide");
        return;
      }

      setFile(selectedFile);

      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const existing = extractSvgMetadata(content);
        setMetadata(existing);
        if (existing.tags && existing.tags.length > 0) {
          setTags(existing.tags);
        }
      };
      reader.readAsText(selectedFile);
    },
    [setFile, setPreviewUrl, setMetadata, setTags],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        await processFile(droppedFile);
      }
    },
    [processFile],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

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
        contributor: contributorAvatar
          ? {
              githubUsername: contributorUsername.trim(),
              githubAvatarUrl: contributorAvatar,
            }
          : undefined,
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
    setContributorUsername("");
    setContributorAvatar(null);
    setGallerySearch("");
    setGalleryDropdownOpen(false);
  };

  const filteredGalleries = galleries.filter((g) =>
    g.name.toLowerCase().includes(gallerySearch.toLowerCase()),
  );

  const selectedGalleryNames = galleries
    .filter((g) => selectedGalleryIds.includes(g.id))
    .map((g) => g);

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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un pictogramme</DialogTitle>
        </DialogHeader>

        {/* Drop zone - full width when no file */}
        {!file && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
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
              disabled={uploading}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <FileUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-base font-medium">
                Glisser-déposer un fichier SVG
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ou cliquer pour parcourir
              </p>
            </div>
          </div>
        )}

        {/* Two-column layout when file is selected */}
        {file && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
            {/* Left column - Preview */}
            <div className="flex flex-col gap-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`relative flex items-center justify-center bg-muted/30 rounded-lg py-12 cursor-pointer transition-colors border-2 border-dashed border-transparent hover:border-primary/30 ${
                  dragActive ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <img
                  src={previewUrl!}
                  alt="Aperçu SVG"
                  className="w-48 h-48 object-contain"
                />
              </div>

              {/* File info */}
              <div className="text-center">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB — SVG
                </p>
                <p className="text-xs text-primary mt-1">
                  Cliquer sur l'image pour remplacer
                </p>
              </div>

              {/* Contributor */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">
                  Contributeur
                </label>
                {loadingTeam ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                ) : teamMembers.length === 0 ? (
                  contributorUsername && contributorAvatar ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={contributorAvatar}
                        alt={contributorUsername}
                        className="w-8 h-8 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background"
                      />
                      <span className="text-sm font-medium">
                        {contributorUsername}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun collaborateur trouvé
                    </p>
                  )
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {teamMembers.map((member) => (
                      <button
                        key={member.login}
                        type="button"
                        onClick={() =>
                          handleSelectContributor(
                            member.login,
                            member.avatar_url,
                          )
                        }
                        disabled={uploading}
                        className={`relative rounded-full transition-all ${
                          contributorUsername === member.login
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "hover:ring-2 hover:ring-muted-foreground/30 hover:ring-offset-1 hover:ring-offset-background opacity-50 hover:opacity-100"
                        }`}
                        title={member.login}
                      >
                        <img
                          src={member.avatar_url}
                          alt={member.login}
                          className="w-9 h-9 rounded-full"
                        />
                      </button>
                    ))}
                    {contributorUsername && (
                      <span className="text-xs text-muted-foreground">
                        {contributorUsername}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Metadata */}
            <div className="flex flex-col gap-4">
              {/* Title */}
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

              {/* Description */}
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

              {/* Tags */}
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
                    className="shrink-0 h-9"
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

              <Separator />

              {/* Gallery combobox */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Collections
                </label>

                {/* Selected galleries as chips */}
                {selectedGalleryNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedGalleryNames.map((gallery) => (
                      <Badge
                        key={gallery.id}
                        variant="secondary"
                        className="gap-1.5 pr-1"
                      >
                        {gallery.color && (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: gallery.color }}
                          />
                        )}
                        {gallery.name}
                        <button
                          type="button"
                          onClick={() => handleToggleGallery(gallery.id)}
                          className="hover:text-destructive"
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Dropdown search */}
                {loadingGalleries ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des collections...
                  </div>
                ) : (
                  <div className="relative" ref={galleryDropdownRef}>
                    <Input
                      placeholder="Rechercher une collection..."
                      value={gallerySearch}
                      onChange={(e) => {
                        setGallerySearch(e.target.value);
                        setGalleryDropdownOpen(true);
                      }}
                      onFocus={() => setGalleryDropdownOpen(true)}
                      disabled={uploading}
                    />

                    {galleryDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                        {filteredGalleries.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3">
                            Aucune collection trouvée
                          </p>
                        ) : (
                          filteredGalleries.map((gallery) => {
                            const isSelected = selectedGalleryIds.includes(
                              gallery.id,
                            );
                            return (
                              <button
                                key={gallery.id}
                                type="button"
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                                onClick={() => handleToggleGallery(gallery.id)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="pointer-events-none"
                                />
                                {gallery.color && (
                                  <span
                                    className="size-3 rounded-full shrink-0"
                                    style={{
                                      backgroundColor: gallery.color,
                                    }}
                                  />
                                )}
                                <span className="truncate">{gallery.name}</span>
                                {isSelected && (
                                  <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
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
                    Créer une collection
                  </button>
                ) : (
                  <div className="mt-2 border rounded-md p-3 space-y-2 bg-muted/20">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nom de la collection"
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

              {/* Actions - bottom right */}
              <div className="flex justify-end gap-2 mt-auto pt-3 border-t">
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
          </div>
        )}

        {/* Actions when no file yet */}
        {!file && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
