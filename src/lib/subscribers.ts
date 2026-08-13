import "server-only";
import { getSupabase, type Subscriber } from "./supabase";
import { NATALIA_FAMILY_ID } from "./families";

/** Add (or re-activate) a subscriber. Returns their unsubscribe token. */
export async function addSubscriber(
  emailRaw: string
): Promise<{ ok: boolean; token?: string; already?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false };
  const email = emailRaw.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("subscribers")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    const row = existing as Subscriber;
    if (row.unsubscribed_at) {
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: null })
        .eq("id", row.id);
    }
    return { ok: true, token: row.token, already: !row.unsubscribed_at };
  }

  const { data, error } = await supabase
    .from("subscribers")
    .insert({ email })
    .select("token")
    .single();
  if (error || !data) return { ok: false };
  return { ok: true, token: (data as { token: string }).token };
}

/** Add (or re-activate) a subscriber for a specific family. */
export async function addFamilySubscriber(
  familyId: string,
  emailRaw: string
): Promise<{ ok: boolean; token?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false };
  const email = emailRaw.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("subscribers")
    .select("*")
    .eq("family_id", familyId)
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    const row = existing as Subscriber;
    if (row.unsubscribed_at) {
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: null })
        .eq("id", row.id);
    }
    return { ok: true, token: row.token };
  }

  const { data, error } = await supabase
    .from("subscribers")
    .insert({ family_id: familyId, email })
    .select("token")
    .single();
  if (error || !data) return { ok: false };
  return { ok: true, token: (data as { token: string }).token };
}

/** Count of active subscribers for a family. */
export async function getFamilySubscriberCount(familyId: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .is("unsubscribed_at", null);
  return count ?? 0;
}

/** Active subscribers for one family (they only hear about their own family). */
export async function getFamilyActiveSubscribers(
  familyId: string
): Promise<Subscriber[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .eq("family_id", familyId)
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true });
  return (data as Subscriber[]) ?? [];
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .eq("family_id", NATALIA_FAMILY_ID)
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true });
  return (data as Subscriber[]) ?? [];
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .eq("family_id", NATALIA_FAMILY_ID)
    .order("created_at", { ascending: true });
  return (data as Subscriber[]) ?? [];
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("token", token)
    .is("unsubscribed_at", null);
  return !error;
}

// --- digest cadence, stored in the settings table ---

export async function getDigestLastSent(): Promise<Date | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "digest_last_sent")
    .maybeSingle();
  const v = (data as { value?: string } | null)?.value;
  return v ? new Date(v) : null;
}

export async function setDigestLastSent(when: Date): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("settings")
    .upsert({ key: "digest_last_sent", value: when.toISOString() }, { onConflict: "key" });
}

/** Stamp a family's digest as sent (per-family cadence, migration 012). */
export async function setFamilyDigestLastSent(
  familyId: string,
  when: Date
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("families")
    .update({ digest_last_sent_at: when.toISOString() })
    .eq("id", familyId);
}
