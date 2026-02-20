import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
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

export const DSFR_PRESET_COLORS = [
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

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description?: string; color?: string }) => Promise<void>;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  initialName?: string;
  initialDescription?: string;
  initialColor?: string;
  namePlaceholder?: string;
  submitLabel?: string;
  allowClearColor?: boolean;
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  onSave,
  title,
  subtitle,
  icon: Icon,
  initialName = "",
  initialDescription = "",
  initialColor = DSFR_PRESET_COLORS[0],
  namePlaceholder = "Nom",
  submitLabel = "Créer",
  allowClearColor = false,
}: CollectionFormDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription);
      setColor(initialColor);
    }
  }, [open, initialName, initialDescription, initialColor]);

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-primary">
              <div className="w-9 h-9 rounded-[4px] bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              {title}
            </DialogTitle>
            {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Input
              autoFocus
              placeholder={namePlaceholder}
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              className="rounded-[4px]"
            />
            <Textarea
              placeholder="Description (optionnelle)..."
              value={description}
              maxLength={500}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-[4px] resize-none"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Couleur</p>
              <div className="flex gap-2 flex-wrap">
                {DSFR_PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              {allowClearColor && color && (
                <button
                  type="button"
                  onClick={() => setColor("")}
                  className="mt-1 text-[0.625rem] text-muted-foreground hover:text-foreground w-fit"
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
              {saving ? "Enregistrement..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
