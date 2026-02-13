import { API_URL } from "@/lib/config";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}`;

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

/**
 * Démarre le flow OAuth GitHub
 */
export function initiateGitHubLogin() {
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
    // Échanger le code contre un token via notre API
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

    // Stocker le token
    localStorage.setItem("github_token", token);

    // Nettoyer l'URL
    window.history.replaceState({}, document.title, REDIRECT_URI);

    // Nettoyer le state
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
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

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
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
  window.location.reload();
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

// Helpers
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
