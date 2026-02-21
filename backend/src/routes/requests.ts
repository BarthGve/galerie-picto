import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { config } from "../config.js";
import { writeImageFile } from "../services/minio.js";
import {
  createRequest,
  getRequestById,
  getRequestsByUser,
  getAllRequests,
  updateRequestStatus,
  assignRequest,
  getActiveRequestCount,
  type RequestStatus,
} from "../db/repositories/picto-requests.js";
import {
  getCommentsByRequestId,
  addComment,
} from "../db/repositories/request-comments.js";
import { createNotification } from "../db/repositories/notifications.js";
import {
  addHistoryEntry,
  getHistory,
} from "../db/repositories/request-history.js";

function buildImageUrl(key: string | null): string | null {
  if (!key) return null;
  return `${config.minio.endpoint}/${config.minio.bucket}/${key}`;
}

const router = Router();

const VALID_URGENCIES = ["normale", "urgente"];
const VALID_STATUSES: RequestStatus[] = [
  "nouvelle",
  "en_cours",
  "precisions_requises",
  "livree",
  "refusee",
];

// GET /api/requests/active-count - Public count of active requests
router.get("/active-count", (_req, res: Response) => {
  res.json({ count: getActiveRequestCount() });
});

// POST /api/requests - Create a new request
router.post(
  "/",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const { title, description, referenceImageKey, urgency } = req.body;
    const login = req.user!.login;

    if (
      !title ||
      typeof title !== "string" ||
      title.trim().length === 0 ||
      title.length > 150
    ) {
      res.status(400).json({ error: "Title is required (max 150 characters)" });
      return;
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0 ||
      description.length > 2000
    ) {
      res
        .status(400)
        .json({ error: "Description is required (max 2000 characters)" });
      return;
    }

    if (urgency && !VALID_URGENCIES.includes(urgency)) {
      res.status(400).json({ error: "Urgency must be 'normale' or 'urgente'" });
      return;
    }

    if (
      referenceImageKey &&
      (typeof referenceImageKey !== "string" || referenceImageKey.length > 500)
    ) {
      res.status(400).json({ error: "Invalid reference image key" });
      return;
    }

    try {
      const id = createRequest({
        requesterLogin: login,
        title: title.trim(),
        description: description.trim(),
        referenceImageKey,
        urgency: urgency || "normale",
      });
      addHistoryEntry({
        requestId: id,
        actorLogin: login,
        action: "created",
        toStatus: "nouvelle",
      });
      res.json({ success: true, id });
    } catch {
      res.status(500).json({ error: "Failed to create request" });
    }
  },
);

// GET /api/requests - List current user's requests
router.get(
  "/",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const login = req.user!.login;
      const requests = getRequestsByUser(login).map((r) => ({
        ...r,
        referenceImageUrl: buildImageUrl(r.referenceImageKey),
      }));
      res.json({ requests });
    } catch {
      res.status(500).json({ error: "Failed to get requests" });
    }
  },
);

// GET /api/requests/admin - List all requests (contributors only)
router.get(
  "/admin",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const statusFilter = req.query.status as RequestStatus | undefined;
      if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
        res.status(400).json({ error: "Invalid status filter" });
        return;
      }
      const requests = getAllRequests(statusFilter).map((r) => ({
        ...r,
        referenceImageUrl: buildImageUrl(r.referenceImageKey),
      }));
      res.json({ requests });
    } catch {
      res.status(500).json({ error: "Failed to get requests" });
    }
  },
);

// GET /api/requests/:id - Get request detail
router.get(
  "/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const id = String(req.params.id);
      const request = getRequestById(id);
      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }
      res.json({
        request: {
          ...request,
          referenceImageUrl: buildImageUrl(request.referenceImageKey),
        },
      });
    } catch {
      res.status(500).json({ error: "Failed to get request" });
    }
  },
);

// PATCH /api/requests/:id/status - Change request status (contributors only)
router.patch(
  "/:id/status",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = String(req.params.id);
    const { status, rejectionReason, deliveredPictogramId, comment } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const request = getRequestById(id);
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    try {
      const result = updateRequestStatus(id, status, {
        rejectionReason,
        deliveredPictogramId,
      });
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      // Auto-post comment in the thread if provided
      const commentText = comment?.trim() || rejectionReason?.trim();
      if (commentText) {
        addComment(id, req.user!.login, commentText);
      }

      addHistoryEntry({
        requestId: id,
        actorLogin: req.user!.login,
        action: "status_changed",
        fromStatus: request.status,
        toStatus: status,
        detail: commentText || undefined,
      });

      const contributorName = req.user!.name || req.user!.login;
      const link = `/requests/${id}`;
      const NOTIF_MAP: Partial<
        Record<RequestStatus, { type: string; message: string }>
      > = {
        en_cours: {
          type: "request_assigned",
          message: `${contributorName} traite votre demande`,
        },
        precisions_requises: {
          type: "request_precisions",
          message: `${contributorName} demande des précisions`,
        },
        livree: {
          type: "request_delivered",
          message: `Votre demande a été livrée`,
        },
        refusee: {
          type: "request_refused",
          message: `Votre demande a été déclinée`,
        },
      };
      const notif = NOTIF_MAP[status as RequestStatus];
      if (notif) {
        createNotification({
          recipientLogin: request.requesterLogin,
          type: notif.type as Parameters<typeof createNotification>[0]["type"],
          title: request.title,
          message: notif.message,
          link,
        });
      }

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update request status" });
    }
  },
);

// POST /api/requests/:id/assign - Assign request to self (contributors only)
router.post(
  "/:id/assign",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = String(req.params.id);
    const login = req.user!.login;

    try {
      const request = getRequestById(id);
      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      const prevStatus = request.status;
      const success = assignRequest(id, login);
      if (!success) {
        res.status(400).json({ error: "Cannot assign this request" });
        return;
      }

      addHistoryEntry({
        requestId: id,
        actorLogin: login,
        action: "assigned",
        fromStatus: prevStatus,
        toStatus: "en_cours",
        detail: login,
      });

      createNotification({
        recipientLogin: request.requesterLogin,
        type: "request_assigned",
        title: request.title,
        message: `${req.user!.name || login} traite votre demande`,
        link: `/requests/${id}`,
      });

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to assign request" });
    }
  },
);

// GET /api/requests/:id/history - List history for a request
router.get(
  "/:id/history",
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const id = String(req.params.id);
      const entries = getHistory(id);
      res.json({ history: entries });
    } catch {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  },
);

// GET /api/requests/:id/comments - List comments for a request
router.get(
  "/:id/comments",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const id = String(req.params.id);
      const comments = getCommentsByRequestId(id);
      res.json({ comments });
    } catch {
      res.status(500).json({ error: "Failed to get comments" });
    }
  },
);

// POST /api/requests/:id/comments - Add a comment
router.post(
  "/:id/comments",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = String(req.params.id);
    const login = req.user!.login;
    const { content } = req.body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0 ||
      content.length > 2000
    ) {
      res
        .status(400)
        .json({ error: "Content is required (max 2000 characters)" });
      return;
    }

    const request = getRequestById(id);
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    try {
      const commentId = addComment(id, login, content.trim());

      // Notify the other party
      const isRequester = login === request.requesterLogin;
      if (isRequester && !request.assignedTo) {
        // Demande non assignée : notifier tous les collaborateurs configurés
        const allowedLogins = config.github.allowedUsername
          ? config.github.allowedUsername
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        for (const collabLogin of allowedLogins) {
          if (collabLogin !== login) {
            createNotification({
              recipientLogin: collabLogin,
              type: "request_comment",
              title: request.title,
              message: `Nouveau commentaire de ${req.user!.name || login}`,
              link: `/requests/${id}`,
            });
          }
        }
      } else {
        const recipientLogin = isRequester
          ? request.assignedTo
          : request.requesterLogin;
        if (recipientLogin && recipientLogin !== login) {
          createNotification({
            recipientLogin,
            type: "request_comment",
            title: request.title,
            message: `Nouveau commentaire de ${req.user!.name || login}`,
            link: `/requests/${id}`,
          });
        }
      }

      res.json({ success: true, id: commentId });
    } catch {
      res.status(500).json({ error: "Failed to add comment" });
    }
  },
);

// POST /api/requests/upload-reference - Upload reference image
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_PREFIXES = ["image/jpeg", "image/png", "image/webp"];
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

router.post(
  "/upload-reference",
  authAnyUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { data, mimeType } = req.body as {
      data?: string;
      mimeType?: string;
    };

    if (!data || typeof data !== "string") {
      res.status(400).json({ error: "Missing image data (base64)" });
      return;
    }

    if (!mimeType || !ALLOWED_MIME_PREFIXES.includes(mimeType)) {
      res
        .status(400)
        .json({ error: "Invalid mimeType. Allowed: jpeg, png, webp" });
      return;
    }

    const buffer = Buffer.from(data, "base64");
    if (buffer.length > MAX_IMAGE_SIZE) {
      res.status(400).json({ error: "Image too large (max 2 MB)" });
      return;
    }

    try {
      const ext = MIME_TO_EXT[mimeType];
      const key = `${config.minio.prefix}requests/${uuidv4()}.${ext}`;
      await writeImageFile(key, buffer, mimeType);
      res.json({ success: true, key });
    } catch {
      res.status(500).json({ error: "Failed to upload reference image" });
    }
  },
);

export default router;
