import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * A server-only Supabase client using the SERVICE ROLE key.
 * This must NEVER be imported into a client component — the `server-only`
 * package above will throw at build time if that ever happens.
 */
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export type Slot = {
  id: string;
  category: "kids" | "support";
  event_date: string | null;
  label: string | null;
  description: string | null;
  sort_order: number;
  claimed: boolean;
  claimed_name: string | null;
  claimed_email: string | null;
  claimed_note: string | null;
  claimed_private: boolean;
  claimed_at: string | null;
  created_at: string;
};
