import "server-only";
import { getSupabase } from "./supabase";

// Natalia is family #1, with a fixed id (see supabase-migrations/001).
// It's used as the DB default for every family_id column so the original
// single-family site keeps working while the platform grows around it.
export const NATALIA_FAMILY_ID = "11111111-1111-1111-1111-111111111111";
export const NATALIA_SLUG = "natalia";

export type Family = {
  id: string;
  slug: string;
  display_name: string;
  honoring: string | null;
  town: string | null;
  has_kids: boolean;
  is_public: boolean;
  contact_email: string;
  edit_token: string;
  status: string;
  created_at: string;
};

/** Look up a family by its URL slug (e.g. "natalia"). */
export async function getFamilyBySlug(slug: string): Promise<Family | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("families")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  return data as Family;
}

/** Look up a family by id. */
export async function getFamilyById(id: string): Promise<Family | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("families")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Family;
}

/** Look up a family by its secret edit token (the private "manage" link). */
export async function getFamilyByEditToken(token: string): Promise<Family | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("families")
    .select("*")
    .eq("edit_token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as Family;
}

/**
 * Turn a family/person name into a clean, unique URL slug.
 * (e.g. "The Rossi Family" -> "rossi-family", falling back to "-2" etc.)
 */
export async function generateUniqueSlug(base: string): Promise<string> {
  const sb = getSupabase();
  const root =
    base
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "family";

  if (!sb) return root;

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await sb
      .from("families")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  // Extremely unlikely fallback: suffix with a short random-ish tail from time.
  return `${root}-${root.length}${root.charCodeAt(0) || 0}`;
}
