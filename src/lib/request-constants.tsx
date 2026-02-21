/* eslint-disable react-refresh/only-export-components -- shared constants + component module */
import type { DotVariant } from "@/components/ui/timeline";

export interface HistoryEntry {
  id: string;
  actorLogin: string;
  actorAvatar: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  detail: string | null;
  createdAt: string;
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nouvelle: { label: "Nouvelle", color: "bg-blue-100 text-blue-700" },
  en_cours: { label: "En cours", color: "bg-amber-100 text-amber-700" },
  precisions_requises: { label: "Précisions requises", color: "bg-orange-100 text-orange-700" },
  livree: { label: "Livrée", color: "bg-emerald-100 text-emerald-700" },
  refusee: { label: "Refusée", color: "bg-red-100 text-red-700" },
};

export const ACTION_LABELS: Record<string, string> = {
  created: "Demande créée",
  assigned: "Assignée",
  status_changed: "Statut modifié",
};

export const STATUS_DOT_VARIANT: Record<string, DotVariant> = {
  nouvelle: "blue",
  en_cours: "amber",
  precisions_requises: "orange",
  livree: "emerald",
  refusee: "red",
};

export const STATUS_TEXT_COLORS: Record<string, string> = {
  nouvelle: "text-blue-600",
  en_cours: "text-amber-600",
  precisions_requises: "text-orange-600",
  livree: "text-emerald-600",
  refusee: "text-red-600",
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.color}`}>
      {s.label}
    </span>
  );
}
