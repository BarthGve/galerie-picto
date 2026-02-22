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

const DEFAULT_PAGE_SIZE = 20;

export function useAdminUsers() {
  const [result, setResult] = useState<AdminUsersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [teamLogins, setTeamLogins] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch team members once
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch(`${API_URL}/api/auth/team`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((members: { login: string }[]) => {
        setTeamLogins(new Set(members.map((m) => m.login)));
      })
      .catch(() => {});
  }, []);

  const fetchUsers = useCallback(async (p: number, s: string, limit: number) => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
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
    fetchUsers(page, search, pageSize);
  }, [fetchUsers, page, search, pageSize]);

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
      fetchUsers(page, search, pageSize);
    },
    [fetchUsers, page, search, pageSize],
  );

  const unban = useCallback(
    async (login: string) => {
      const token = getStoredToken();
      if (!token) return;
      await fetch(`${API_URL}/api/admin/users/${login}/unban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search, pageSize);
    },
    [fetchUsers, page, search, pageSize],
  );

  const removeUser = useCallback(
    async (login: string) => {
      const token = getStoredToken();
      if (!token) return;
      await fetch(`${API_URL}/api/admin/users/${login}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search, pageSize);
    },
    [fetchUsers, page, search, pageSize],
  );

  return {
    result,
    loading,
    error,
    page,
    search,
    pageSize,
    teamLogins,
    setPage,
    setPageSize,
    handleSearchChange,
    ban,
    unban,
    removeUser,
    refetch: () => fetchUsers(page, search, pageSize),
  };
}
