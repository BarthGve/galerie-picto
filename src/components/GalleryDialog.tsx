import { Folders } from "lucide-react";
import { CollectionFormDialog, DSFR_PRESET_COLORS } from "@/components/ui/collection-form-dialog";
import type { Gallery } from "@/lib/types";

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
  const isEditing = !!gallery;

  return (
    <CollectionFormDialog
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      title={isEditing ? "Modifier la galerie" : "Nouvelle galerie"}
      subtitle={
        isEditing
          ? "Modifiez les informations de la galerie."
          : "Créez une nouvelle galerie pour organiser vos pictogrammes."
      }
      icon={Folders}
      initialName={gallery?.name ?? ""}
      initialDescription={gallery?.description ?? ""}
      initialColor={gallery?.color ?? DSFR_PRESET_COLORS[0]}
      namePlaceholder="Ex: Urgences"
      submitLabel={isEditing ? "Modifier" : "Créer"}
      allowClearColor
    />
  );
}
