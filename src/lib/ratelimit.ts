import "server-only";
import { getSupabase } from "./supabase";

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Returns true if this hit is allowed, false if it should be blocked. Backed by
 * the rate_limits table + rate_limit_hit() RPC (migration 014).
 *
 * FAILS OPEN: if Supabase is unreachable, the RPC is missing (migration not
 * run yet), or anything throws, we allow the request. Spam protection must
 * never take precedence over a grieving family being able to sign up.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    const { data, error } = await sb.rpc("rate_limit_hit", {
      p_bucket: bucket,
      p_identifier: identifier,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[ratelimit] RPC error — failing open:", error.message);
      return true;
    }
    return data !== false;
  } catch (err) {
    console.error("[ratelimit] threw — failing open:", err);
    return true;
  }
}

/** Standard 429 body for a blocked submission. */
export const TOO_MANY = {
  ok: false,
  error: "That's a lot of requests in a short time. Please try again in a little while.",
};
