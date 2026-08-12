import "server-only";
import { getSupabase } from "./supabase";

// Natalia is family #1, with a fixed id (see supabase-migrations/001).
// It's used as the DB default for every family_id column so the original
// single-family site keeps working while the platform grows around it.
export const NATALIA_FAMILY_ID = "11111111-1111-1111-1111-111111111111";
export const NATALIA_SLUG = "natalia";

// Paths the app already uses — never hand these out as family slugs.
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "unsubscribe",
  "weekend-ideas",
  "welcome",
  "welcome.html",
  "robots",
  "robots.txt",
  "sitemap",
  "sitemap.xml",
  "manage",
  "create",
  "new",
  "_next",
  "favicon",
  "favicon.ico",
  "public",
  "static",
]);

export type FamilyContent = {
  kicker?: string;
  intro_title?: string;
  intro_message?: string;
  hero_image_url?: string;
  memorial_title?: string;
  memorial_intro?: string;
  memorial_when?: string;
  memorial_where?: string;
  memorial_note?: string;
  gifts_intro?: string;
  pay_venmo?: string;
  pay_cashapp?: string;
  pay_zelle?: string;
  // Section visibility — undefined means "on" (so existing pages are unchanged).
  show_calendar?: boolean;
  show_memorial?: boolean;
  show_gifts?: boolean;
  show_subscribe?: boolean;
  show_memories?: boolean;
};

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
  content: FamilyContent | null;
  created_at: string;
};

export type CreateFamilyInput = {
  creatorName: string;
  contactEmail: string;
  displayName: string;
  honoring?: string;
  town?: string;
  hasKids: boolean;
  isPublic: boolean;
  introMessage?: string;
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
 * Turn a family/person name into a clean, unique URL slug that isn't reserved
 * and isn't already taken (e.g. "The Rossi Family" -> "rossi-family").
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

  for (let i = 0; i < 60; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (RESERVED_SLUGS.has(candidate)) continue;
    if (!sb) return candidate;
    const { data } = await sb
      .from("families")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${root.length}${(root.charCodeAt(0) || 0) % 97}`;
}

/** A warm default opening message when a family doesn't write their own. */
function defaultIntro(input: CreateFamilyInput): string {
  const who = input.honoring?.trim();
  const kids = input.hasKids;
  const line1 = who
    ? `In the wake of losing ${who}, so many people have wanted to know how to show up for this family — and haven't always known how.`
    : `After a loss, so many people want to show up for the family — and don't always know how.`;
  const line2 = kids
    ? `There is no way to fill the space that's been left behind. But there are ways to surround them — and their children — with presence, consistency, and care.`
    : `There is no way to fill the space that's been left behind. But there are ways to surround them with presence, consistency, and care.`;
  const line3 = `This page is simply a way to do that together — meals, visits, a hand with everyday life, and memories worth keeping — for as long as it takes.`;
  return [line1, line2, line3].join("\n\n");
}

/** Create a brand-new family (page) and return it. */
export async function createFamily(
  input: CreateFamilyInput
): Promise<Family | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const slug = await generateUniqueSlug(input.honoring || input.displayName);

  const content: FamilyContent = {
    kicker: "For the people who love them",
    intro_title: input.displayName,
    intro_message: input.introMessage?.trim() || defaultIntro(input),
  };

  const { data, error } = await sb
    .from("families")
    .insert({
      slug,
      display_name: input.displayName,
      honoring: input.honoring?.trim() || null,
      town: input.town?.trim() || null,
      has_kids: input.hasKids,
      is_public: input.isPublic,
      contact_email: input.contactEmail,
      content,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("createFamily failed", error);
    return null;
  }
  return data as Family;
}
