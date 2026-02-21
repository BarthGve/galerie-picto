import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { config } from "../config.js";
import { authAnyUser } from "../middleware/auth-any-user.js";
import type { AuthenticatedRequest, GitHubUser } from "../middleware/auth.js";
import {
  getSeenIssueIds,
  markIssueSeen,
  markIssuesSeen,
} from "../db/repositories/feedback-seen.js";

interface GitHubLabel {
  name: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  closed_at: string;
  html_url: string;
  labels: GitHubLabel[];
}

interface GitHubComment {
  body: string;
}

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

const router = Router();

// SSE registry: githubLogin -> Set<Response>
const sseClients = new Map<string, Set<Response>>();

// Issues cache: 5 min TTL
interface FeedbackItem {
  id: number;
  type: "bug" | "improvement";
  title: string;
  reportedBy: string;
  createdAt: string;
  status: "open" | "resolved";
  resolution?: string;
  url: string;
}
let issuesCache: { data: FeedbackItem[]; expiresAt: number } | null = null;

// Rate limiting: 5 submissions per user per hour
const submissionCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(login: string): boolean {
  const now = Date.now();
  const entry = submissionCounts.get(login);
  if (!entry || entry.resetAt < now) {
    submissionCounts.set(login, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

async function githubFetch(path: string, options: RequestInit = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.feedback.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
}

async function getIssueResolution(issueNumber: number): Promise<string> {
  if (!config.feedback.token || !config.feedback.repo)
    return "Résolu sans commentaire";
  try {
    const res = await githubFetch(
      `/repos/${config.feedback.repo}/issues/${issueNumber}/comments?per_page=100`,
    );
    if (!res.ok) return "Résolu sans commentaire";
    const comments = (await res.json()) as GitHubComment[];
    const last = comments[comments.length - 1];
    return last?.body?.slice(0, 300) || "Résolu sans commentaire";
  } catch {
    return "Résolu sans commentaire";
  }
}

function extractReporter(body: string): string {
  const match = body?.match(/(?:signalé par|demandée? par)\s+@([\w-]+)/i);
  return match?.[1] ?? "inconnu";
}

function pushSseNotification(
  reporterLogin: string,
  payload: Record<string, unknown>,
) {
  const clients = sseClients.get(reporterLogin);
  if (!clients?.size) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

// ─── POST /api/feedback — Create GitHub issue (auth required) ───────────────
router.post(
  "/",
  authAnyUser,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as GitHubUser;

    if (!config.feedback.token || !config.feedback.repo) {
      return void res
        .status(503)
        .json({ error: "Service de signalement non configuré" });
    }

    if (!checkRateLimit(user.login)) {
      return void res.status(429).json({
        error: "Trop de signalements. Réessayez dans une heure.",
      });
    }

    const { type, title, fields } = req.body as {
      type: "bug" | "improvement";
      title: string;
      fields: Record<string, string>;
    };

    if (!type || !title?.trim() || !fields) {
      return void res.status(400).json({ error: "Données manquantes" });
    }
    if (!["bug", "improvement"].includes(type)) {
      return void res.status(400).json({ error: "Type invalide" });
    }
    if (title.trim().length > 100) {
      return void res
        .status(400)
        .json({ error: "Titre trop long (max 100 caractères)" });
    }

    const body =
      type === "bug"
        ? [
            `## 🐛 Bug signalé par @${user.login}`,
            ``,
            `### Description`,
            fields.description || "Non renseigné",
            ``,
            `### Étapes pour reproduire`,
            fields.steps || "Non renseigné",
            ``,
            `### Comportement attendu`,
            fields.expected || "Non renseigné",
            ``,
            `### Impact`,
            fields.impact || "Non renseigné",
            ``,
            `---`,
            `_Signalé via la Galerie de Pictogrammes_`,
          ].join("\n")
        : [
            `## ✨ Amélioration demandée par @${user.login}`,
            ``,
            `### Pourquoi cette amélioration ?`,
            fields.context || "Non renseigné",
            ``,
            `### Description de l'amélioration`,
            fields.description || "Non renseigné",
            ``,
            `### Importance pour l'utilisateur`,
            fields.importance || "Non renseigné",
            ``,
            `---`,
            `_Demandé via la Galerie de Pictogrammes_`,
          ].join("\n");

    const labels = type === "bug" ? ["bug"] : ["enhancement"];

    try {
      const ghRes = await githubFetch(`/repos/${config.feedback.repo}/issues`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body, labels }),
      });

      if (!ghRes.ok) {
        console.error(
          "GitHub issue creation failed:",
          ghRes.status,
          await ghRes.text(),
        );
        return void res
          .status(500)
          .json({ error: "Impossible de créer le signalement" });
      }

      const issue = (await ghRes.json()) as {
        html_url: string;
        number: number;
      };
      issuesCache = null; // Invalidate cache
      res.status(201).json({ url: issue.html_url, number: issue.number });
    } catch (err) {
      console.error("GitHub error:", err);
      res.status(500).json({ error: "Erreur de communication avec GitHub" });
    }
  },
);

// ─── GET /api/feedback — List all issues (public) ───────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  if (!config.feedback.token || !config.feedback.repo) {
    return void res
      .status(503)
      .json({ error: "Service de signalement non configuré" });
  }

  const now = Date.now();
  if (issuesCache && issuesCache.expiresAt > now) {
    return void res.json(issuesCache.data);
  }

  try {
    const [bugsRes, enhRes] = await Promise.all([
      githubFetch(
        `/repos/${config.feedback.repo}/issues?labels=bug&state=all&per_page=50&sort=created&direction=desc`,
      ),
      githubFetch(
        `/repos/${config.feedback.repo}/issues?labels=enhancement&state=all&per_page=50&sort=created&direction=desc`,
      ),
    ]);

    if (!bugsRes.ok || !enhRes.ok) {
      return void res
        .status(500)
        .json({ error: "Impossible de récupérer les signalements" });
    }

    const [bugs, enhancements] = (await Promise.all([
      bugsRes.json(),
      enhRes.json(),
    ])) as [GitHubIssue[], GitHubIssue[]];

    const allIssues = [...bugs, ...enhancements]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 50);

    const data: FeedbackItem[] = await Promise.all(
      allIssues.map(async (issue) => {
        let resolution: string | undefined;
        if (issue.state === "closed") {
          resolution = await getIssueResolution(issue.number);
        }
        return {
          id: issue.number,
          type: issue.labels?.some((l: GitHubLabel) => l.name === "bug")
            ? "bug"
            : "improvement",
          title: issue.title,
          reportedBy: extractReporter(issue.body ?? ""),
          createdAt: issue.created_at,
          status: issue.state === "open" ? "open" : "resolved",
          resolution,
          url: issue.html_url,
        };
      }),
    );

    issuesCache = { data, expiresAt: now + 5 * 60_000 };
    res.json(data);
  } catch (err) {
    console.error("GitHub error:", err);
    res.status(500).json({ error: "Erreur de communication avec GitHub" });
  }
});

// ─── GET /api/feedback/notifications — Resolved issues for current user ─────
router.get(
  "/notifications",
  authAnyUser,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as GitHubUser;

    if (!config.feedback.token || !config.feedback.repo) {
      return void res.json([]);
    }

    try {
      const [bugsRes, enhRes] = await Promise.all([
        githubFetch(
          `/repos/${config.feedback.repo}/issues?labels=bug&state=closed&per_page=50&sort=updated&direction=desc`,
        ),
        githubFetch(
          `/repos/${config.feedback.repo}/issues?labels=enhancement&state=closed&per_page=50&sort=updated&direction=desc`,
        ),
      ]);

      if (!bugsRes.ok || !enhRes.ok) return void res.json([]);

      const [bugs, enhancements] = (await Promise.all([
        bugsRes.json(),
        enhRes.json(),
      ])) as [GitHubIssue[], GitHubIssue[]];

      const myIssues = [...bugs, ...enhancements].filter((issue) =>
        issue.body?.includes(`@${user.login}`),
      );

      const seenIds = getSeenIssueIds(user.login);

      const notifications = await Promise.all(
        myIssues.map(async (issue) => ({
          id: issue.number,
          type: issue.labels?.some((l: GitHubLabel) => l.name === "bug")
            ? "bug"
            : "improvement",
          title: issue.title,
          closedAt: issue.closed_at,
          resolution: await getIssueResolution(issue.number),
          url: issue.html_url,
          isRead: seenIds.has(issue.number),
        })),
      );

      res.json(notifications);
    } catch (err) {
      console.error("GitHub error:", err);
      res.json([]);
    }
  },
);

// ─── POST /api/feedback/seen/all — Mark all notifications as read ────────────
router.post(
  "/seen/all",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as GitHubUser;
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
      return void res
        .status(400)
        .json({ error: "ids doit être un tableau de nombres" });
    }
    markIssuesSeen(user.login, ids);
    res.status(204).end();
  },
);

// ─── POST /api/feedback/seen/:id — Mark one notification as read ─────────────
router.post(
  "/seen/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as GitHubUser;
    const issueId = parseInt(req.params.id as string, 10);
    if (isNaN(issueId) || issueId <= 0) {
      return void res.status(400).json({ error: "ID invalide" });
    }
    markIssueSeen(user.login, issueId);
    res.status(204).end();
  },
);

// ─── GET /api/feedback/stream — SSE (auth via Bearer header) ────────────────
router.get(
  "/stream",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as GitHubUser;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Register client
    if (!sseClients.has(user.login)) {
      sseClients.set(user.login, new Set());
    }
    sseClients.get(user.login)!.add(res);

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 30_000);

    res.write(": connected\n\n");

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      const clients = sseClients.get(user.login);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) sseClients.delete(user.login);
      }
    });
  },
);

// ─── POST /api/feedback/webhook — GitHub webhook ─────────────────────────────
router.post("/webhook", async (req: Request, res: Response) => {
  // Webhook secret is mandatory — reject if not configured
  if (!config.feedback.webhookSecret) {
    return void res.status(503).json({ error: "Webhook not configured" });
  }

  const event = req.headers["x-github-event"] as string;
  const signature = req.headers["x-hub-signature-256"] as string | undefined;

  if (!signature) {
    return void res.status(401).json({ error: "Missing webhook signature" });
  }

  const rawBody = (req as RequestWithRawBody).rawBody;
  if (rawBody) {
    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", config.feedback.webhookSecret)
        .update(rawBody)
        .digest("hex");
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return void res.status(401).json({ error: "Invalid signature" });
    }
  }

  if (event !== "issues" || req.body?.action !== "closed") {
    return void res.status(200).json({ ok: true });
  }

  const issue = req.body.issue;
  if (!issue) return void res.status(200).json({ ok: true });

  const reporterLogin = extractReporter(issue.body ?? "");
  if (!reporterLogin || reporterLogin === "inconnu") {
    return void res.status(200).json({ ok: true });
  }

  // Invalidate public cache
  issuesCache = null;

  // Push SSE notification asynchronously
  const type = (issue.labels as GitHubLabel[])?.some((l) => l.name === "bug")
    ? "bug"
    : "improvement";
  getIssueResolution(issue.number).then((resolution) => {
    pushSseNotification(reporterLogin, {
      id: issue.number,
      type,
      title: issue.title,
      resolution,
      url: issue.html_url,
    });
  });

  res.status(200).json({ ok: true });
});

export default router;
