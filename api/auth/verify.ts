import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * API Route: Vérifie que l'utilisateur est autorisé à uploader
 * GET /api/auth/verify
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const allowedUsername = process.env.GITHUB_ALLOWED_USERNAME || "BarthGve";

  try {
    // Récupérer les infos de l'utilisateur depuis GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await userResponse.json();

    // Vérifier que c'est l'utilisateur autorisé
    if (user.login !== allowedUsername) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Only ${allowedUsername} can upload`,
      });
    }

    return res.status(200).json({
      authorized: true,
      username: user.login,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Verification failed" });
  }
}
