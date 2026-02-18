import { useState, useEffect } from "react";
import { Folders } from "lucide-react";
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

// 17 couleurs illustratives DSFR
const COLOR_PRESETS = [
  "#b7a73f",  // green-tilleul-verveine-main
  "#68a532",  // green-bourgeon-main
  "#00a95f",  // green-emeraude-main
  "#009081",  // green-menthe-main
  "#009099",  // green-archipel-main
  "#465f9d",  // blue-ecume-main
  "#417dc4",  // blue-cumulus-main
  "#a558a0",  // purple-glycine-main
  "#e18b76",  // pink-macaron-main
  "#ce614a",  // pink-tuile-main
  "#c8aa39",  // yellow-tournesol-main
  "#c3992a",  // yellow-moutarde-main
  "#e4794a",  // orange-terre-battue-main
  "#d1b781",  // brown-cafe-creme-main
  "#c08c65",  // brown-caramel-main
  "#bd987a",  // brown-opera-main
  "#aea397",  // beige-gris-galet-main
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
            <DialogTitle className="flex items-center gap-3 text-primary">
              <div className="w-9 h-9 rounded-[4px] bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Folders className="w-4 h-4" />
              </div>
              {isEditing ? "Modifier la galerie" : "Nouvelle galerie"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les informations de la galerie."
                : "Créez une nouvelle galerie pour organiser vos pictogrammes."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="gallery-name">Nom *</Label>
              <Input
                id="gallery-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Urgences"
                required
                className="rounded-[4px]"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="gallery-description">Description</Label>
              <Textarea
                id="gallery-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                className="rounded-[4px]"
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
              className="rounded-[4px]"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim() || saving} className="rounded-[4px]">
              {saving ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
