import { Router } from "express";

const router = Router();

// Cache en memoire (30 min TTL)
const profileCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000;

/**
 * GET /api/github/profile/:username
 * Proxy vers l'API publique GitHub pour recuperer un profil utilisateur.
 * Cache memoire 30 min.
 */
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }

  // Verifier le cache
  const cached = profileCache.get(username);
  if (cached && cached.expires > Date.now()) {
    res.json(cached.data);
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "galerie-picto-backend",
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      res
        .status(response.status)
        .json({ error: "Failed to fetch GitHub profile" });
      return;
    }

    const raw = await response.json();
    const profile = {
      login: raw.login,
      name: raw.name,
      bio: raw.bio,
      location: raw.location,
      company: raw.company,
      avatar_url: raw.avatar_url,
      html_url: raw.html_url,
      public_repos: raw.public_repos,
      followers: raw.followers,
    };

    // Mettre en cache
    profileCache.set(username, {
      data: profile,
      expires: Date.now() + CACHE_TTL,
    });

    res.json(profile);
  } catch {
    res.status(500).json({ error: "Failed to fetch GitHub profile" });
  }
});

export default router;
