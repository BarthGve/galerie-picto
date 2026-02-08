import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * API Route: Échange le code OAuth GitHub contre un access token
 * POST /api/auth/github
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, redirect_uri } = req.body;

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: "Missing code or redirect_uri" });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Échanger le code contre un token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri,
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const data = await tokenResponse.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return res.status(200).json({ access_token: data.access_token });
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "OAuth exchange failed",
    });
  }
}
