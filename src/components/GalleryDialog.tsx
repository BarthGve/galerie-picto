import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Gallery } from "@/lib/types";

const COLOR_PRESETS = [
  "#003399",
  "#e11d48",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#4f46e5",
];

interface GalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery?: Gallery | null;
  onSave: (data: {
    name: string;
    description?: string;
    color?: string;
  }) => Promise<void>;
}

export function GalleryDialog({
  open,
  onOpenChange,
  gallery,
  onSave,
}: GalleryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = !!gallery;

  useEffect(() => {
    if (open) {
      setName(gallery?.name ?? "");
      setDescription(gallery?.description ?? "");
      setColor(gallery?.color ?? "");
    }
  }, [open, gallery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier la galerie" : "Nouvelle galerie"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les informations de la galerie."
                : "Creez une nouvelle galerie pour organiser vos pictogrammes."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="gallery-name">Nom *</Label>
              <Input
                id="gallery-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gendarmerie"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="gallery-description">Description</Label>
              <Textarea
                id="gallery-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Couleur</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    className="size-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: preset,
                      borderColor:
                        color === preset ? "var(--foreground)" : "transparent",
                    }}
                  />
                ))}
                <Input
                  type="color"
                  value={color || "#003399"}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-6 cursor-pointer rounded-full border-0 p-0"
                />
              </div>
              {color && (
                <button
                  type="button"
                  onClick={() => setColor("")}
                  className="text-[0.625rem] text-muted-foreground hover:text-foreground w-fit"
                >
                  Supprimer la couleur
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? "Enregistrement..." : isEditing ? "Modifier" : "Creer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
