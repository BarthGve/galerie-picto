import { Router, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import {
  createGdprRequest,
  getAllGdprRequests,
  updateGdprRequestStatus,
  getGdprRequestCount,
  type GdprRightType,
  type GdprStatus,
} from "../db/repositories/gdpr-requests.js";
import { getGdprHistory } from "../db/repositories/gdpr-request-history.js";
import { createNotification } from "../db/repositories/notifications.js";
import { config } from "../config.js";
import { notifyN8nGdpr } from "../services/n8n-notify.js";
import { db } from "../db/index.js";
import { users, gdprRequests } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

const VALID_RIGHT_TYPES: GdprRightType[] = [
  "acces",
  "rectification",
  "effacement",
  "portabilite",
  "opposition",
];

const VALID_STATUSES: GdprStatus[] = ["nouveau", "en_cours", "traite"];

// POST /api/gdpr-requests - Submit a GDPR request (any connected user)
router.post(
  "/",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const { rightType, message, consentContact } = req.body;
    const login = req.user!.login;

    if (!rightType || !VALID_RIGHT_TYPES.includes(rightType)) {
      res.status(400).json({
        error:
          "rightType must be one of: acces, rectification, effacement, portabilite, opposition",
      });
      return;
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > 2000
    ) {
      res
        .status(400)
        .json({ error: "Message is required (max 2000 characters)" });
      return;
    }

    if (consentContact !== true) {
      res.status(400).json({ error: "Consent to be contacted is required" });
      return;
    }

    try {
      const id = createGdprRequest({
        requesterLogin: login,
        rightType,
        message: message.trim(),
        consentContact: true,
      });

      // Notify all collaborators
      const collabLogins = config.github.allowedUsername
        ? config.github.allowedUsername
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      for (const collabLogin of collabLogins) {
        if (collabLogin !== login) {
          createNotification({
            recipientLogin: collabLogin,
            type: "gdpr_new",
            title: "Nouvelle demande RGPD",
            message: `Demande de ${req.user!.name || login} — ${rightType}`,
            link: "/admin",
          });
        }
      }

      // In-app confirmation to requester
      createNotification({
        recipientLogin: login,
        type: "gdpr_status",
        title: "Demande RGPD enregistrée",
        message: `Votre demande de ${rightType} a bien été reçue`,
        link: "/profile",
      });

      // Notify requester by email via n8n
      notifyN8nGdpr({
        event: "request_created",
        request: { id, rightType, status: "nouveau" },
        user: {
          login,
          name: req.user!.name || undefined,
          email: req.user!.email || undefined,
        },
        siteUrl: config.corsOrigin,
      });

      res.status(201).json({ id });
    } catch {
      res.status(500).json({ error: "Failed to create GDPR request" });
    }
  },
);

// GET /api/gdpr-requests/admin - List all GDPR requests (admin only)
router.get(
  "/admin",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page)) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit)) || 20),
      );
      const statusFilter = req.query.status as GdprStatus | undefined;

      if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
        res.status(400).json({ error: "Invalid status filter" });
        return;
      }

      const result = getAllGdprRequests({ page, limit, status: statusFilter });
      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to get GDPR requests" });
    }
  },
);

// PATCH /api/gdpr-requests/admin/:id/status - Change request status (admin only)
router.patch(
  "/admin/:id/status",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = String(req.params.id);
    const { status, responseMessage } = req.body;
    const actorLogin = req.user!.login;

    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    if (
      status === "traite" &&
      (!responseMessage ||
        typeof responseMessage !== "string" ||
        !responseMessage.trim())
    ) {
      res
        .status(400)
        .json({ error: "responseMessage is required when marking as traité" });
      return;
    }

    const sanitizedResponse =
      responseMessage && typeof responseMessage === "string"
        ? responseMessage.trim().slice(0, 5000)
        : undefined;

    try {
      const result = updateGdprRequestStatus(
        id,
        status,
        actorLogin,
        sanitizedResponse,
      );
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      // Notify requester by email via n8n
      const reqData = db
        .select({
          rightType: gdprRequests.rightType,
          requesterLogin: gdprRequests.requesterLogin,
          requesterName: users.githubName,
          requesterEmail: users.githubEmail,
        })
        .from(gdprRequests)
        .leftJoin(users, eq(gdprRequests.requesterLogin, users.githubLogin))
        .where(eq(gdprRequests.id, id))
        .get();

      if (reqData) {
        // In-app notification to requester
        const gdprStatusMessages: Record<string, string> = {
          en_cours: "Votre demande RGPD est en cours de traitement",
          traite: "Votre demande RGPD a été traitée",
        };
        const statusMsg = gdprStatusMessages[status];
        if (statusMsg) {
          createNotification({
            recipientLogin: reqData.requesterLogin,
            type: "gdpr_status",
            title: `Demande RGPD — ${reqData.rightType}`,
            message: statusMsg,
            link: "/profile",
          });
        }

        const event =
          status === "en_cours"
            ? "status_en_cours"
            : status === "traite"
              ? "status_traite"
              : "status_changed";

        notifyN8nGdpr({
          event,
          request: {
            id,
            rightType: reqData.rightType,
            status,
            responseMessage: sanitizedResponse,
          },
          user: {
            login: reqData.requesterLogin,
            name: reqData.requesterName || undefined,
            email: reqData.requesterEmail || undefined,
          },
          siteUrl: config.corsOrigin,
        });
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to update GDPR request status" });
    }
  },
);

// GET /api/gdpr-requests/admin/count - Count of "nouveau" requests (admin only)
router.get(
  "/admin/count",
  authMiddleware,
  (_req: AuthenticatedRequest, res: Response): void => {
    try {
      const count = getGdprRequestCount("nouveau");
      res.json({ count });
    } catch {
      res.status(500).json({ error: "Failed to count GDPR requests" });
    }
  },
);

// GET /api/gdpr-requests/admin/:id/history - Get request history (admin only)
router.get(
  "/admin/:id/history",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = String(req.params.id);
    try {
      const history = getGdprHistory(id);
      res.json({ history });
    } catch {
      res.status(500).json({ error: "Failed to get GDPR request history" });
    }
  },
);

export default router;
