/**
 * In-memory ban list. Populated at startup from DB, updated on ban/unban actions.
 * Checked in every auth middleware so bans take effect immediately.
 */
const bannedLogins = new Set<string>();

export function initBanList(logins: string[]): void {
  for (const login of logins) {
    bannedLogins.add(login);
  }
}

export function isBanned(login: string): boolean {
  return bannedLogins.has(login);
}

export function addBan(login: string): void {
  bannedLogins.add(login);
}

export function removeBan(login: string): void {
  bannedLogins.delete(login);
}
