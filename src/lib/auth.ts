import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * A very small, dependency-free auth gate for the /admin dashboard.
 *
 * There is no user database — just a single shared password stored in the
 * ADMIN_PASSWORD environment variable. On login we set an httpOnly cookie
 * whose value is an HMAC derived from that password, so the cookie can't be
 * forged without knowing the password, and the password itself is never
 * stored in the browser.
 */

const COOKIE_NAME = "sfn_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto
    .createHmac("sha256", password)
    .update("support-for-natalia:admin:v1")
    .digest("hex");
}

/** Constant-time comparison to avoid timing leaks. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function adminPasswordIsSet(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(candidate: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return safeEqual(candidate, password);
}

export function setAdminCookie(): void {
  const token = expectedToken();
  if (!token) return;
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearAdminCookie(): void {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function isAdmin(): boolean {
  const token = expectedToken();
  if (!token) return false;
  const cookie = cookies().get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, token);
}
