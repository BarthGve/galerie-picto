import { config } from "../config.js";
import {
  isEmailNotifEnabled,
  type EmailNotifKey,
} from "../db/repositories/users.js";

interface N8nGdprPayload {
  event: string;
  request: {
    id: string;
    rightType: string;
    status: string;
    responseMessage?: string;
  };
  user: {
    login: string;
    name?: string;
    email?: string;
  };
  siteUrl: string;
}

export interface N8nPictoRequestPayload {
  event:
    | "picto_request_new"
    | "picto_request_submitted"
    | "picto_request_en_cours"
    | "picto_request_precisions"
    | "picto_request_livree"
    | "picto_request_refusee";
  request: {
    id: string;
    title: string;
    status: string;
    requesterLogin: string;
    urgency?: string;
    rejectionReason?: string;
    pictogramUrl?: string;
  };
  recipient: {
    login: string;
    name?: string;
    email?: string;
  };
  siteUrl: string;
}

/**
 * Fire-and-forget POST to n8n webhook.
 * Never throws — logs errors silently so it doesn't block the main request.
 */
interface N8nNewUserPayload {
  event: "new_user_registered";
  newUser: {
    login: string;
    name?: string;
    avatarUrl?: string;
  };
  recipient: {
    login: string;
    name?: string;
    email: string;
  };
  siteUrl: string;
}

function sendToN8n(
  payload: N8nGdprPayload | N8nPictoRequestPayload | N8nNewUserPayload,
): void {
  const url = config.n8n.webhookUrl;
  if (!url) return;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => {
    console.warn("[n8n-notify] Failed to send notification:", err.message);
  });
}

/**
 * Send GDPR notification. Checks user's notifyEmailGdpr preference.
 */
export function notifyN8nGdpr(payload: N8nGdprPayload): void {
  if (!config.n8n.webhookUrl) return;
  if (!isEmailNotifEnabled(payload.user.login, "notifyEmailGdpr")) return;
  sendToN8n(payload);
}

/**
 * Send picto request notification. Checks recipient's preference for the given key.
 * Short-circuits if recipient has no email.
 */
export function notifyN8nPictoRequest(
  payload: N8nPictoRequestPayload,
  prefKey?: EmailNotifKey,
): void {
  if (!config.n8n.webhookUrl) return;
  if (!payload.recipient.email) return;
  if (prefKey && !isEmailNotifEnabled(payload.recipient.login, prefKey)) return;
  sendToN8n(payload);
}

/**
 * Notify collaborators about a new user registration.
 * Checks each recipient's notifyEmailNewUser preference.
 */
export function notifyN8nNewUser(payload: N8nNewUserPayload): void {
  if (!config.n8n.webhookUrl) return;
  if (!payload.recipient.email) return;
  if (!isEmailNotifEnabled(payload.recipient.login, "notifyEmailNewUser"))
    return;
  sendToN8n(payload);
}
