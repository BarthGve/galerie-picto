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
import { CollectionFormDialog, DSFR_PRESET_COLORS } from "@/components/ui/collection-form-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import type { UserCollection } from "@/lib/types";

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
  const [deleteTarget, setDeleteTarget] = useState<UserCollection | null>(null);

  const handleSaveCollection = async (data: { name: string; description?: string; color?: string }) => {
    if (editTarget) {
      await onUpdate(editTarget.id, { name: data.name, color: data.color, description: data.description ?? null });
      setEditTarget(null);
    } else {
      const col = await onCreate(data.name, data.color, data.description);
      if (col) toast.success(`Collection « ${col.name} » créée`);
    }
  };

  const handleDelete = async (col: UserCollection) => {
    await onRemove(col.id);
    toast.success(`Collection « ${col.name} » supprimée`);
    if (selectedCollectionId === col.id) onSelectCollection(null);
    setDeleteTarget(null);
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
    <CollectionFormDialog
      open={createOpen || !!editTarget}
      onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditTarget(null); } }}
      onSave={handleSaveCollection}
      title={editTarget ? "Modifier la collection" : "Nouvelle collection utilisateur"}
      icon={FolderPlus}
      initialName={editTarget?.name ?? ""}
      initialDescription={editTarget?.description ?? ""}
      initialColor={editTarget?.color ?? DSFR_PRESET_COLORS[0]}
      namePlaceholder="Nom de la collection"
      submitLabel={editTarget ? "Enregistrer" : "Créer"}
    />
  );

  const DeleteDialog = (
    <DeleteConfirmDialog
      open={!!deleteTarget}
      onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      title="Supprimer cette collection ?"
      description={<>La collection <span className="font-semibold">« {deleteTarget?.name} »</span> sera supprimée définitivement. Les pictogrammes qu'elle contient ne seront pas supprimés.</>}
    />
  );

  return (
    <>
      {DialogForm}
      {DeleteDialog}
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="px-3 mb-1 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Mes collections
          </span>
          <button
            onClick={() => setCreateOpen(true)}
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
                  {col.pictogramIds.length + (col.userPictogramIds?.length ?? 0)}
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
                    <DropdownMenuItem className="rounded-[4px]" onClick={() => setEditTarget(col)}>
                      <Pencil />
                      <span>Modifier</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-[4px]" variant="destructive" onClick={() => setDeleteTarget(col)}>
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
              const col = await onCreate("Ma collection", DSFR_PRESET_COLORS[0]);
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
