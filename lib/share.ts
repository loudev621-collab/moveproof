import { randomBytes } from "node:crypto";

// SERVER ONLY. 32-character secret for a share link; impossible to guess.
export function makeShareToken() {
  return randomBytes(24).toString("base64url");
}

export function shareUrl(token: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/r/${token}`;
}
