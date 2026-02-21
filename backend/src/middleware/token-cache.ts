import type { GitHubUser } from "./auth.js";

const MAX_SIZE = 10_000;
const TOKEN_CACHE_TTL = 5 * 60_000;
const CLEANUP_INTERVAL = 10 * 60_000;

interface CachedEntry {
  user: GitHubUser;
  isCollaborator: boolean;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedEntry>();

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of tokenCache) {
    if (entry.expiresAt <= now) tokenCache.delete(key);
  }
}

setInterval(evictExpired, CLEANUP_INTERVAL).unref();

export function getCachedToken(token: string): CachedEntry | undefined {
  const entry = tokenCache.get(token);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    tokenCache.delete(token);
    return undefined;
  }
  return entry;
}

export function setCachedToken(
  token: string,
  user: GitHubUser,
  isCollaborator: boolean,
): void {
  if (tokenCache.size >= MAX_SIZE) {
    const firstKey = tokenCache.keys().next().value;
    if (firstKey !== undefined) tokenCache.delete(firstKey);
  }
  tokenCache.set(token, {
    user,
    isCollaborator,
    expiresAt: Date.now() + TOKEN_CACHE_TTL,
  });
}

export function deleteCachedToken(token: string): void {
  tokenCache.delete(token);
}
