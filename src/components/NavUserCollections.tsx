import { useState } from "react";
import { CirclePlus, MoreHorizontal, Pencil, Trash2, FolderOpen, FolderPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { UserCollection } from "@/lib/types";

// 17 couleurs illustratives DSFR
const PRESET_COLORS = [
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

interface NavUserCollectionsProps {
  collections: UserCollection[];
  selectedCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onCreate: (name: string, color?: string, description?: string) => Promise<UserCollection | null>;
  onUpdate: (id: string, data: { name?: string; color?: string | null; description?: string | null }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onAddPictogram: (collectionId: string, pictogramId: string) => Promise<boolean>;
}

export function NavUserCollections({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreate,
  onUpdate,
  onRemove,
  onAddPictogram,
}: NavUserCollectionsProps) {
  const { isMobile } = useSidebar();
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserCollection | null>(null);
  const [inputName, setInputName] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  const [inputColor, setInputColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setInputName("");
    setInputDescription("");
    setInputColor(PRESET_COLORS[0]);
    setCreateOpen(true);
  };

  const openEdit = (col: UserCollection) => {
    setEditTarget(col);
    setInputName(col.name);
    setInputDescription(col.description ?? "");
    setInputColor(col.color ?? PRESET_COLORS[0]);
  };

  const handleSave = async () => {
    if (!inputName.trim()) return;
    setSaving(true);
    try {
      const desc = inputDescription.trim() || undefined;
      if (editTarget) {
        await onUpdate(editTarget.id, { name: inputName.trim(), color: inputColor, description: desc ?? null });
        setEditTarget(null);
      } else {
        const col = await onCreate(inputName.trim(), inputColor, desc);
        if (col) {
          setCreateOpen(false);
          toast.success(`Collection « ${col.name} » créée`);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (col: UserCollection) => {
    if (!window.confirm(`Supprimer « ${col.name} » ?`)) return;
    await onRemove(col.id);
    toast.success(`Collection « ${col.name} » supprimée`);
    if (selectedCollectionId === col.id) onSelectCollection(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    if (e.dataTransfer.types.includes("application/pictogram-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOverId(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, col: UserCollection) => {
    e.preventDefault();
    setDragOverId(null);
    const pictoId = e.dataTransfer.getData("application/pictogram-id");
    if (!pictoId) return;
    const ok = await onAddPictogram(col.id, pictoId);
    if (ok) toast.success(`Ajouté à « ${col.name} »`);
  };

  const DialogForm = (
    <Dialog
      open={createOpen || !!editTarget}
      onOpenChange={(open) => {
        if (!open) { setCreateOpen(false); setEditTarget(null); }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-primary">
            <div className="w-9 h-9 rounded-[4px] bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <FolderPlus className="w-4 h-4" />
            </div>
            {editTarget ? "Modifier la collection" : "Nouvelle collection utilisateur"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            autoFocus
            placeholder="Nom de la collection"
            value={inputName}
            maxLength={100}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="rounded-[4px]"
          />
          <Textarea
            placeholder="Description (optionnelle)..."
            value={inputDescription}
            maxLength={500}
            rows={2}
            onChange={(e) => setInputDescription(e.target.value)}
            className="rounded-[4px] resize-none"
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Couleur</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${inputColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setInputColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setCreateOpen(false); setEditTarget(null); }} className="rounded-[4px]">
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!inputName.trim() || saving} className="rounded-[4px]">
            {editTarget ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {DialogForm}
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="px-3 mb-1 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Mes collections
          </span>
          <button
            onClick={openCreate}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Nouvelle collection"
          >
            <CirclePlus className="size-3.5" />
          </button>
        </div>
        <SidebarMenu>
          {collections.length === 0 ? (
            <li className="px-3 py-2 text-[11px] text-muted-foreground italic">
              Aucune collection — glissez des pictos ici
            </li>
          ) : (
            collections.map((col) => (
              <SidebarMenuItem key={col.id}>
                <SidebarMenuButton
                  isActive={selectedCollectionId === col.id}
                  onClick={() => onSelectCollection(
                    selectedCollectionId === col.id ? null : col.id
                  )}
                  tooltip={col.name}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleDrop(e, col)}
                  className={dragOverId === col.id ? "ring-2 ring-primary bg-primary/10" : ""}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: col.color ?? "var(--muted-foreground)", opacity: col.color ? 1 : 0.3 }}
                  />
                  <span className="text-sm font-bold">{col.name}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="group-hover/menu-item:opacity-0 transition-opacity text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent text-muted-foreground">
                  {col.pictogramIds.length}
                </SidebarMenuBadge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover className="data-[state=open]:bg-accent rounded-[4px]">
                      <MoreHorizontal />
                      <span className="sr-only">Plus</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-36 rounded-[4px] border-border"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem className="rounded-[4px]" onClick={() => openEdit(col)}>
                      <Pencil />
                      <span>Modifier</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-[4px]" variant="destructive" onClick={() => handleDelete(col)}>
                      <Trash2 />
                      <span>Supprimer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>

        {/* Drop zone global quand pas de collections */}
        {collections.length === 0 && (
          <div
            className="mx-2 mt-1 h-12 rounded border-2 border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground gap-1.5 transition-colors"
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("application/pictogram-id")) {
                e.preventDefault();
                e.currentTarget.classList.add("border-primary", "bg-primary/5");
              }
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("border-primary", "bg-primary/5");
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-primary", "bg-primary/5");
              const pictoId = e.dataTransfer.getData("application/pictogram-id");
              if (!pictoId) return;
              // Auto-create first collection
              const col = await onCreate("Ma collection", PRESET_COLORS[0]);
              if (col) {
                await onAddPictogram(col.id, pictoId);
                toast.success(`Ajouté à « ${col.name} »`);
              }
            }}
          >
            <FolderOpen className="size-3.5" />
            Déposez ici
          </div>
        )}
      </SidebarGroup>
    </>
  );
}
