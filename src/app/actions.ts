"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSupabase, type Slot } from "@/lib/supabase";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import {
  sendClaimNotification,
  sendMemoryNotification,
  sendRsvpNotification,
  sendGiftNotification,
} from "@/lib/email";
import { stripJpegMetadata } from "@/lib/image";
import {
  saveMemory,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_FILES,
  type IncomingFile,
} from "@/lib/memories";

export type ClaimState = {
  ok: boolean;
  message: string;
  slotId?: string;
};

export async function claimSlot(
  _prev: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const slotId = String(formData.get("slotId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const isPrivate = formData.get("private") === "on";

  if (!slotId) {
    return { ok: false, message: "Something went wrong. Please refresh." };
  }
  if (!name) {
    return { ok: false, message: "Please add your name.", slotId };
  }
  if (name.length > 120) {
    return { ok: false, message: "That name looks too long.", slotId };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "That email doesn't look right.", slotId };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Sign-ups aren't connected yet. Please check back soon.",
      slotId,
    };
  }

  // Atomic claim: only succeeds if the row is still unclaimed. Postgres
  // evaluates `.eq("claimed", false)` inside the UPDATE, so two people
  // clicking at the same time can never both win — the second gets 0 rows.
  const { data, error } = await supabase
    .from("slots")
    .update({
      claimed: true,
      claimed_name: name,
      claimed_email: email || null,
      claimed_note: note || null,
      claimed_private: isPrivate,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", slotId)
    .eq("claimed", false)
    .select();

  if (error) {
    console.error("[claimSlot] update failed:", error);
    return {
      ok: false,
      message: "Sorry — we couldn't save that. Please try again.",
      slotId,
    };
  }

  if (!data || data.length === 0) {
    revalidatePath("/");
    return {
      ok: false,
      message: "Ah — someone just grabbed this one. Please pick another.",
      slotId,
    };
  }

  // Notify the family (never blocks the sign-up if email is misconfigured).
  await sendClaimNotification({
    slot: data[0] as Slot,
    name,
    email,
    note,
    isPrivate,
  });

  // Use the editable confirmation message (falls back to the default).
  let confirmation = DEFAULT_SETTINGS.confirmation_message;
  try {
    const settings = await getSettings();
    if (settings.confirmation_message) {
      confirmation = settings.confirmation_message;
    }
  } catch {
    // keep default
  }

  revalidatePath("/");
  return { ok: true, message: confirmation, slotId };
}

// -------------------------------------------------------------------
// Events: "Come Cheer Them On" — many people can RSVP to one event.
// -------------------------------------------------------------------

export type RsvpState = { ok: boolean; message: string; eventId?: string };

export async function rsvpEvent(
  _prev: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  const eventId = String(formData.get("eventId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!eventId) {
    return { ok: false, message: "Something went wrong. Please refresh." };
  }
  if (!name) {
    return { ok: false, message: "Please add your name.", eventId };
  }
  if (name.length > 120) {
    return { ok: false, message: "That name looks too long.", eventId };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "That email doesn't look right.", eventId };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "RSVPs aren't connected yet. Please check back soon.",
      eventId,
    };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, event_time, location")
    .eq("id", eventId)
    .single();

  if (!event) {
    revalidatePath("/");
    return {
      ok: false,
      message: "That event isn't available anymore.",
      eventId,
    };
  }

  const { error } = await supabase.from("event_rsvps").insert({
    event_id: eventId,
    name,
    email: email || null,
    note: note || null,
  });

  if (error) {
    console.error("[rsvpEvent] insert failed:", error);
    return {
      ok: false,
      message: "Sorry — we couldn't save that. Please try again.",
      eventId,
    };
  }

  await sendRsvpNotification({
    eventTitle: (event as { title: string }).title,
    name,
    email,
    note,
  });

  let confirmation = DEFAULT_SETTINGS.events_confirmation;
  try {
    const settings = await getSettings();
    if (settings.events_confirmation) confirmation = settings.events_confirmation;
  } catch {
    // keep default
  }

  revalidatePath("/");
  return { ok: true, message: confirmation, eventId };
}

// -------------------------------------------------------------------
// Gifts: "Give a Gift" — people chip in toward a gift for Natalia.
// -------------------------------------------------------------------

export type PledgeState = { ok: boolean; message: string; giftId?: string };

export async function pledgeGift(
  _prev: PledgeState,
  formData: FormData
): Promise<PledgeState> {
  const giftId = String(formData.get("giftId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const amountRaw = String(formData.get("amount") || "").trim();

  if (!giftId) {
    return { ok: false, message: "Something went wrong. Please refresh." };
  }
  if (!name) {
    return { ok: false, message: "Please add your name.", giftId };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "That email doesn't look right.", giftId };
  }

  let amount: number | null = null;
  if (amountRaw) {
    const parsed = Number(amountRaw.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, message: "That amount doesn't look right.", giftId };
    }
    amount = parsed || null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "This isn't connected yet. Please check back soon.",
      giftId,
    };
  }

  const { data: gift } = await supabase
    .from("gifts")
    .select("id, title")
    .eq("id", giftId)
    .single();
  if (!gift) {
    revalidatePath("/");
    return { ok: false, message: "That gift isn't available anymore.", giftId };
  }

  const { error } = await supabase.from("gift_pledges").insert({
    gift_id: giftId,
    name,
    email: email || null,
    amount,
    note: note || null,
  });

  if (error) {
    console.error("[pledgeGift] insert failed:", error);
    return {
      ok: false,
      message: "Sorry — we couldn't save that. Please try again.",
      giftId,
    };
  }

  await sendGiftNotification({
    giftTitle: (gift as { title: string }).title,
    name,
    email,
    amount,
    note,
  });

  let confirmation = DEFAULT_SETTINGS.gifts_confirmation;
  try {
    const settings = await getSettings();
    if (settings.gifts_confirmation) confirmation = settings.gifts_confirmation;
  } catch {
    // keep default
  }

  revalidatePath("/");
  return { ok: true, message: confirmation, giftId };
}

// -------------------------------------------------------------------
// Memories: "Tell the Kids a Story About Their Dad"
// -------------------------------------------------------------------

export type MemoryState = { ok: boolean; message: string };

const MAX_STORY_CHARS = 8000;

export async function submitMemory(
  _prev: MemoryState,
  formData: FormData
): Promise<MemoryState> {
  const authorName = String(formData.get("name") || "").trim();
  const authorEmail = String(formData.get("email") || "").trim();
  const story = String(formData.get("story") || "").trim();

  const rawFiles = formData
    .getAll("media")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!story && rawFiles.length === 0) {
    return {
      ok: false,
      message: "Please write a story or add at least one photo.",
    };
  }
  if (story.length > MAX_STORY_CHARS) {
    return { ok: false, message: "That story is a bit too long to save." };
  }
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return { ok: false, message: "That email doesn't look right." };
  }
  if (rawFiles.length > MAX_FILES) {
    return {
      ok: false,
      message: `Please share up to ${MAX_FILES} photos at a time.`,
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Sharing isn't connected yet. Please check back soon.",
    };
  }

  // Validate + process each file on the server (never trust the browser).
  const files: IncomingFile[] = [];
  for (const file of rawFiles) {
    const contentType = (file.type || "").toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return {
        ok: false,
        message:
          "Only photos are supported here (JPEG, PNG, WEBP, GIF, or HEIC).",
      };
    }
    if (file.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        message: `Each photo needs to be under ${Math.floor(
          MAX_FILE_BYTES / (1024 * 1024)
        )} MB.`,
      };
    }

    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    // Strip location/EXIF metadata from JPEGs where feasible.
    if (contentType === "image/jpeg") {
      buffer = stripJpegMetadata(buffer);
    }

    files.push({
      buffer,
      fileName: file.name || "photo",
      contentType,
      sizeBytes: buffer.length,
    });
  }

  const result = await saveMemory({ authorName, authorEmail, story, files });
  if (!result.ok) {
    return {
      ok: false,
      message: result.error || "Sorry — we couldn't save that. Please try again.",
    };
  }

  // Notify the family (link only — never the memory itself).
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    const proto = h.get("x-forwarded-proto") || "https";
    const baseUrl = process.env.SITE_URL || (host ? `${proto}://${host}` : "");
    if (baseUrl) {
      await sendMemoryNotification({
        baseUrl,
        authorName,
        hasStory: Boolean(story),
        photoCount: result.photoCount,
      });
    }
  } catch (err) {
    console.error("[submitMemory] notification failed:", err);
  }

  let confirmation = DEFAULT_SETTINGS.stories_confirmation;
  try {
    const settings = await getSettings();
    if (settings.stories_confirmation) {
      confirmation = settings.stories_confirmation;
    }
  } catch {
    // keep default
  }

  return { ok: true, message: confirmation };
}
