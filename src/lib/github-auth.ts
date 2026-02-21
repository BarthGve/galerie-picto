import { API_URL } from "@/lib/config";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
const REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}`;

export const DEV_MODE = import.meta.env.DEV && !GITHUB_CLIENT_ID;

const DEV_USER: GitHubUser = {
  login: "dev-user",
  name: "Dev User",
  avatar_url: "https://api.dicebear.com/9.x/pixel-art/svg?seed=dev",
  email: "dev@localhost",
};

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

/**
 * Démarre le flow OAuth GitHub.
 * Si pas de client ID configuré, ne fait rien (le dev login est géré par App).
 */
export function initiateGitHubLogin() {
  if (DEV_MODE) {
    // Pas de redirection — le dev login est géré côté App via devLogin()
    return;
  }

  const state = generateRandomState();
  sessionStorage.setItem("github_oauth_state", state);

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", "read:user user:email");
  authUrl.searchParams.set("state", state);

  window.location.href = authUrl.toString();
}

/**
 * Retourne un fake user pour le mode dev.
 * Met aussi le token en localStorage pour que isAuthenticated() fonctionne.
 */
export function devLogin(): GitHubUser {
  localStorage.setItem("github_token", "dev-token");
  return DEV_USER;
}

/**
 * Gère le callback OAuth GitHub
 */
export async function handleGitHubCallback(): Promise<string | null> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const savedState = sessionStorage.getItem("github_oauth_state");

  if (!code || !state || state !== savedState) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const data = await response.json();
    const token = data.access_token;

    localStorage.setItem("github_token", token);
    window.history.replaceState({}, document.title, REDIRECT_URI);
    sessionStorage.removeItem("github_oauth_state");

    return token;
  } catch (error) {
    console.error("Error handling GitHub callback:", error);
    return null;
  }
}

/**
 * Récupère les informations de l'utilisateur depuis le JWT applicatif.
 * Le JWT est signé par le backend — on décode simplement le payload (pas de secret nécessaire côté client).
 */
export async function getGitHubUser(token: string): Promise<GitHubUser | null> {
  if (DEV_MODE && token === "dev-token") {
    return DEV_USER;
  }

  // Token de dev invalide en production — purger silencieusement
  if (token === "dev-token") {
    localStorage.removeItem("github_token");
    return null;
  }

  // Décoder le JWT applicatif (3 segments séparés par des points)
  const parts = token.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
        login?: string;
        name?: string | null;
        avatar_url?: string;
        email?: string | null;
        exp?: number;
      };

      // Vérifier l'expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("github_token");
        return null;
      }

      if (payload.login && payload.avatar_url) {
        return {
          login: payload.login,
          name: payload.name ?? payload.login,
          avatar_url: payload.avatar_url,
          email: payload.email ?? "",
        };
      }
    } catch {
      // payload invalide — continuer vers la vérification serveur
    }
  }

  // Fallback : vérification via l'endpoint /api/auth/verify
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      localStorage.removeItem("github_token");
      return null;
    }

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub user:", error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est autorisé à uploader
 */
export async function verifyUploadPermission(token: string): Promise<boolean> {
  if (DEV_MODE && token === "dev-token") return true;

  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (error) {
    console.error("Error verifying upload permission:", error);
    return false;
  }
}

/**
 * Déconnecte l'utilisateur
 */
export function logout() {
  localStorage.removeItem("github_token");
  window.location.href = "/";
}

/**
 * Récupère le token stocké
 */
export function getStoredToken(): string | null {
  return localStorage.getItem("github_token");
}

/**
 * Vérifie si le token stocké est un JWT applicatif valide (3 segments base64url).
 * Les anciens tokens GitHub (ghp_xxx) ne sont pas des JWT et sont purgés automatiquement.
 */
function isJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3;
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export function isAuthenticated(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  // Token de dev toujours valide
  if (token === "dev-token") return true;
  // Purger les anciens tokens GitHub (non-JWT)
  if (!isJwt(token)) {
    localStorage.removeItem("github_token");
    return false;
  }
  // Vérifier l'expiration côté client
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("github_token");
      return false;
    }
  } catch {
    localStorage.removeItem("github_token");
    return false;
  }
  return true;
}

function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
