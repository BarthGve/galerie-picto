import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredToken } from "@/lib/github-auth";
import { API_URL } from "@/lib/config";

export interface AdminUser {
  githubLogin: string;
  githubName: string | null;
  githubAvatarUrl: string | null;
  githubEmail: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  bannedAt: string | null;
  favoritesCount: number;
  likesCount: number;
  userPictogramsCount: number;
}

export interface AdminUsersResult {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 20;

export function useAdminUsers() {
  const [result, setResult] = useState<AdminUsersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (p: number, s: string) => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (s) params.set("search", s);
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setResult((await res.json()) as AdminUsersResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, search);
  }, [fetchUsers, page, search]);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPage(1);
        setSearch(value);
      }, 350);
    },
    [],
  );

  const ban = useCallback(
    async (login: string) => {
      const token = getStoredToken();
      if (!token) return;
      await fetch(`${API_URL}/api/admin/users/${login}/ban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search);
    },
    [fetchUsers, page, search],
  );

  const unban = useCallback(
    async (login: string) => {
      const token = getStoredToken();
      if (!token) return;
      await fetch(`${API_URL}/api/admin/users/${login}/unban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search);
    },
    [fetchUsers, page, search],
  );

  const removeUser = useCallback(
    async (login: string) => {
      const token = getStoredToken();
      if (!token) return;
      await fetch(`${API_URL}/api/admin/users/${login}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search);
    },
    [fetchUsers, page, search],
  );

  return {
    result,
    loading,
    error,
    page,
    search,
    pageSize: PAGE_SIZE,
    setPage,
    handleSearchChange,
    ban,
    unban,
    removeUser,
    refetch: () => fetchUsers(page, search),
  };
}
