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

export type GatheringRsvp = {
  id: string;
  name: string;
  email: string | null;
  party_size: number;
  note: string | null;
  created_at: string;
};

export type BookingKind = "kids" | "meal" | "visit" | "errand";
export type BookingStatus = "requested" | "confirmed" | "declined";

export type Booking = {
  id: string;
  event_date: string; // YYYY-MM-DD
  kind: BookingKind;
  status: BookingStatus;
  name: string;
  email: string | null;
  note: string | null;
  private: boolean;
  created_at: string;
};

export type ActivityIdea = {
  id: string;
  title: string;
  event_date: string | null;
  location: string | null;
  url: string | null;
  note: string | null;
  sort_order: number;
  created_at: string;
};

export type EventRsvp = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  note: string | null;
  created_at: string;
};

export type FamilyEvent = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  rsvps: EventRsvp[];
};

export type GiftPledge = {
  id: string;
  gift_id: string;
  name: string;
  email: string | null;
  amount: number | null;
  note: string | null;
  created_at: string;
};

export type Gift = {
  id: string;
  title: string;
  description: string | null;
  cost: number | null;
  link: string | null;
  sort_order: number;
  created_at: string;
  pledges: GiftPledge[];
};
