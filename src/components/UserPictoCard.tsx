import { useState, useEffect } from "react";
import { Trash2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getStoredToken } from "@/lib/github-auth";
import { API_URL } from "@/lib/config";
import type { UserPictogram } from "@/lib/types";
import { toast } from "sonner";

interface UserPictoCardProps {
  picto: UserPictogram;
  onDelete?: (id: string) => void;
}

export function UserPictoCard({ picto, onDelete }: UserPictoCardProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    const token = getStoredToken();
    if (!token) return;

    fetch(`${API_URL}/api/user/pictograms/${picto.id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.blob();
      })
      .then((blob) => {
        if (!blob || revoked) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => {});

    return () => {
      revoked = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [picto.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getStoredToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/user/pictograms/${picto.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success(`« ${picto.name} » supprimé`);
        onDelete?.(picto.id);
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="group relative overflow-hidden rounded border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Private badge */}
      <span className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] text-muted-foreground bg-background/80 rounded px-1.5 py-0.5 border border-border">
        <Lock className="size-2.5" />
        Privé
      </span>

      <div className="relative flex items-center justify-center aspect-[4/3] p-4">
        {blobUrl ? (
          <img
            src={blobUrl}
            alt={picto.name}
            loading="lazy"
            decoding="async"
            width={128}
            height={128}
            className="w-full h-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110 max-w-24 max-h-24"
          />
        ) : (
          <div className="w-16 h-16 bg-muted/40 rounded animate-pulse" />
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-background/80 border border-border text-muted-foreground hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-border">
        <h3 className="font-extrabold text-sm text-foreground truncate leading-tight">
          {picto.name}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatFileSize(picto.size)}
        </p>
      </div>
    </Card>
  );
}
