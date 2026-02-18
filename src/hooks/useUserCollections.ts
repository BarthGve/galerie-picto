import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/github-auth";
import { toast } from "sonner";
import type { UserCollection } from "@/lib/types";

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useUserCollections(isAuthenticated: boolean) {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/collections`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setCollections(data.collections);
    } catch {
      // silently fail — collections are non-critical
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const create = useCallback(
    async (name: string, color?: string, description?: string): Promise<UserCollection | null> => {
      // Optimistic placeholder
      const tempId = `temp-${Date.now()}`;
      const temp: UserCollection = {
        id: tempId,
        userLogin: "",
        name,
        description: description ?? null,
        color: color ?? null,
        position: collections.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pictogramIds: [],
      };
      setCollections((prev) => [...prev, temp]);

      try {
        const res = await fetch(`${API_URL}/api/user/collections`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ name, color, description }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create");
        }
        const data = await res.json();
        setCollections((prev) =>
          prev.map((c) => (c.id === tempId ? data.collection : c)),
        );
        return data.collection;
      } catch (e) {
        setCollections((prev) => prev.filter((c) => c.id !== tempId));
        toast.error(e instanceof Error ? e.message : "Erreur création collection");
        return null;
      }
    },
    [collections.length],
  );

  const update = useCallback(
    async (id: string, data: { name?: string; color?: string | null; description?: string | null }) => {
      const prev = collections;
      setCollections((cols) =>
        cols.map((c) => (c.id === id ? { ...c, ...data } : c)),
      );
      try {
        const res = await fetch(`${API_URL}/api/user/collections/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
      } catch {
        setCollections(prev);
        toast.error("Erreur mise à jour collection");
      }
    },
    [collections],
  );

  const remove = useCallback(
    async (id: string) => {
      const prev = collections;
      setCollections((cols) => cols.filter((c) => c.id !== id));
      try {
        const res = await fetch(`${API_URL}/api/user/collections/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to delete");
      } catch {
        setCollections(prev);
        toast.error("Erreur suppression collection");
      }
    },
    [collections],
  );

  const addPictogram = useCallback(
    async (collectionId: string, pictogramId: string): Promise<boolean> => {
      const col = collections.find((c) => c.id === collectionId);
      if (col?.pictogramIds.includes(pictogramId)) {
        toast.info(`Déjà dans « ${col.name} »`);
        return false;
      }
      // Optimistic
      setCollections((cols) =>
        cols.map((c) =>
          c.id === collectionId
            ? { ...c, pictogramIds: [...c.pictogramIds, pictogramId] }
            : c,
        ),
      );
      try {
        const res = await fetch(
          `${API_URL}/api/user/collections/${collectionId}/pictograms`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ pictogramId }),
          },
        );
        if (res.status === 409) {
          toast.info(`Déjà dans « ${col?.name ?? "la collection"} »`);
          return false;
        }
        if (!res.ok) throw new Error("Failed to add");
        return true;
      } catch {
        setCollections((cols) =>
          cols.map((c) =>
            c.id === collectionId
              ? { ...c, pictogramIds: c.pictogramIds.filter((id) => id !== pictogramId) }
              : c,
          ),
        );
        toast.error("Erreur ajout picto");
        return false;
      }
    },
    [collections],
  );

  const removePictogram = useCallback(
    async (collectionId: string, pictogramId: string) => {
      setCollections((cols) =>
        cols.map((c) =>
          c.id === collectionId
            ? { ...c, pictogramIds: c.pictogramIds.filter((id) => id !== pictogramId) }
            : c,
        ),
      );
      try {
        const res = await fetch(
          `${API_URL}/api/user/collections/${collectionId}/pictograms/${pictogramId}`,
          { method: "DELETE", headers: authHeaders() },
        );
        if (!res.ok) throw new Error("Failed to remove");
      } catch {
        toast.error("Erreur retrait picto");
        await fetchCollections();
      }
    },
    [fetchCollections],
  );

  const reorderCollections = useCallback(
    async (collectionIds: string[]) => {
      setCollections((cols) => {
        const map = new Map(cols.map((c) => [c.id, c]));
        return collectionIds
          .map((id, i) => ({ ...map.get(id)!, position: i }))
          .filter(Boolean);
      });
      try {
        await fetch(`${API_URL}/api/user/collections/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ collectionIds }),
        });
      } catch {
        toast.error("Erreur réorganisation");
        await fetchCollections();
      }
    },
    [fetchCollections],
  );

  return {
    collections,
    loading,
    create,
    update,
    remove,
    addPictogram,
    removePictogram,
    reorderCollections,
    refetch: fetchCollections,
  };
}
