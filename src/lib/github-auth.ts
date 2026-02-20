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
  authUrl.searchParams.set("scope", "read:user user:email repo");
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
 * Récupère les informations de l'utilisateur GitHub
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

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.status === 401) {
      // Token expiré ou révoqué — déconnecter proprement
      localStorage.removeItem("github_token");
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch user info");
    }

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
  localStorage.removeItem("feedback_seen_issues");
  window.location.href = "/";
}

/**
 * Récupère le token stocké
 */
export function getStoredToken(): string | null {
  return localStorage.getItem("github_token");
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
