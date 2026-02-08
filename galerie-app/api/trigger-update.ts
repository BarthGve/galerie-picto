import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * API Route: Déclenche le workflow GitHub pour mettre à jour la galerie
 * POST /api/trigger-update
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const allowedUsername = process.env.GITHUB_ALLOWED_USERNAME || "BarthGve";

  // Vérifier que l'utilisateur est autorisé
  try {
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

    if (user.login !== allowedUsername) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.error("Auth verification error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }

  // Déclencher le workflow
  try {
    const owner = process.env.GITHUB_REPO_OWNER || "BarthGve";
    const repo = process.env.GITHUB_REPO_NAME || "galerie-picto";
    const workflowId = "update-gallery.yml";

    const workflowResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main", // ou "master" selon ta branche
        }),
      },
    );

    if (!workflowResponse.ok) {
      const error = await workflowResponse.text();
      console.error("Workflow trigger error:", error);
      throw new Error("Failed to trigger workflow");
    }

    return res.status(200).json({
      success: true,
      message: "Gallery update triggered",
    });
  } catch (error) {
    console.error("Workflow trigger error:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to trigger update",
    });
  }
}
