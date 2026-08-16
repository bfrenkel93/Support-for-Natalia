"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSupabase, type BookingKind } from "@/lib/supabase";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import {
  sendMemoryNotification,
  sendRsvpNotification,
  sendGiftNotification,
  sendBookingNotification,
  sendGatheringRsvpNotification,
  sendSubscribeConfirmation,
  sendRsvpConfirmation,
} from "@/lib/email";
import { getGatheringRsvps } from "@/lib/gathering";
import { insertRsvpWithToken } from "@/lib/rsvp";
import { addSubscriber } from "@/lib/subscribers";

function requestBaseUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // ignore
  }
  return "";
}
import { KIND_LABEL } from "@/lib/bookings";
import { stripJpegMetadata } from "@/lib/image";
import {
  saveMemory,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_FILES,
  type IncomingFile,
} from "@/lib/memories";

// -------------------------------------------------------------------
// Bookings: the open shared sign-up calendar.
// -------------------------------------------------------------------

export type BookingState = { ok: boolean; message: string };

const VALID_KINDS: BookingKind[] = ["kids", "meal", "visit", "errand"];

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function addBooking(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const eventDate = String(formData.get("event_date") || "").trim();
  const kind = String(formData.get("kind") || "").trim() as BookingKind;
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const isPrivate = formData.get("private") === "on";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { ok: false, message: "Please choose a day first." };
  }
  if (!VALID_KINDS.includes(kind)) {
    return { ok: false, message: "Please choose what you'd like to do." };
  }
  if (!name) {
    return { ok: false, message: "Please add your name." };
  }
  if (name.length > 120) {
    return { ok: false, message: "That name looks too long." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "That email doesn't look right." };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Sign-ups aren't connected yet. Please check back soon.",
    };
  }

  // Visits and kids weekends are a request that Natalia approves; meals and
  // errands are instant (no reason to gate a dropped-off meal).
  const requested = kind === "kids" || kind === "visit";
  const status = requested ? "requested" : "confirmed";

  const { error } = await supabase.from("bookings").insert({
    event_date: eventDate,
    kind,
    status,
    name,
    email: email || null,
    note: note || null,
    private: isPrivate,
  });

  if (error) {
    // 23505 = unique violation → the one-meal-per-day rule.
    if ((error as { code?: string }).code === "23505") {
      return {
        ok: false,
        message:
          "A meal is already booked for that day — please pick another day, or choose a visit instead.",
      };
    }
    console.error("[addBooking] insert failed:", error);
    return {
      ok: false,
      message: "Sorry — we couldn't save that. Please try again.",
    };
  }

  // Build an absolute base URL for the dashboard link in the email.
  let baseUrl = process.env.SITE_URL || "";
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    const proto = h.get("x-forwarded-proto") || "https";
    if (!baseUrl && host) baseUrl = `${proto}://${host}`;
  } catch {
    // ignore
  }

  await sendBookingNotification({
    kind,
    kindLabel: KIND_LABEL[kind],
    dateLabel: prettyDate(eventDate),
    name,
    email,
    note,
    requested,
    baseUrl,
  });

  // Optional opt-in to ongoing updates.
  if (email && formData.get("subscribe") === "on") {
    try {
      const r = await addSubscriber(email);
      if (r.token && baseUrl) await sendSubscribeConfirmation(email, r.token, baseUrl);
    } catch (err) {
      console.error("[addBooking] subscribe failed:", err);
    }
  }

  revalidatePath("/");

  if (requested) {
    return {
      ok: true,
      message:
        kind === "visit"
          ? "Your request has been sent to Natalia. She'll confirm your visit or suggest another day — thank you for offering to show up. 💛"
          : "Your request has been sent to Natalia. She'll confirm this weekend or suggest another — thank you for offering to show up for the kids. 💛",
    };
  }

  let confirmation = DEFAULT_SETTINGS.confirmation_message;
  try {
    const settings = await getSettings();
    if (settings.confirmation_message) confirmation = settings.confirmation_message;
  } catch {
    // keep default
  }

  return { ok: true, message: confirmation };
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
// Subscribe — "stay involved" updates.
// -------------------------------------------------------------------

export type SubscribeState = { ok: boolean; message: string };

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const email = String(formData.get("email") || "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Please enter a valid email." };
  }
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, message: "This isn't connected yet. Please check back soon." };
  }

  const result = await addSubscriber(email);
  if (!result.ok) {
    return { ok: false, message: "Sorry — that didn't go through. Please try again." };
  }

  if (result.token) {
    const baseUrl = requestBaseUrl();
    if (baseUrl) {
      await sendSubscribeConfirmation(email, result.token, baseUrl);
    }
  }

  return {
    ok: true,
    message: "You're on the list — thank you for staying close. 💛",
  };
}

// -------------------------------------------------------------------
// Gathering RSVPs — the memorial. Guests give a party size.
// -------------------------------------------------------------------

export type GatheringState = { ok: boolean; message: string };

export async function rsvpGathering(
  _prev: GatheringState,
  formData: FormData
): Promise<GatheringState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const note = String(formData.get("note") || "").trim();
  let partySize = Number(formData.get("party_size") || 1);

  if (!name) return { ok: false, message: "Please add your name." };
  if (name.length > 120) return { ok: false, message: "That name looks too long." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "That email doesn't look right." };
  }
  if (!Number.isFinite(partySize)) partySize = 1;
  partySize = Math.max(1, Math.min(30, Math.round(partySize)));

  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, message: "RSVPs aren't connected yet. Please check back soon." };
  }

  const { cancelToken, error } = await insertRsvpWithToken(supabase, "gathering_rsvps", {
    name,
    email: email || null,
    party_size: partySize,
    note: note || null,
  });

  if (error) {
    console.error("[rsvpGathering] insert failed:", error);
    return { ok: false, message: "Sorry — we couldn't save that. Please try again." };
  }

  // Running headcount for the organizer's email.
  let total = partySize;
  try {
    total = (await getGatheringRsvps()).total;
  } catch {
    // fall back to this party size
  }

  await sendGatheringRsvpNotification({ name, partySize, email, note, total });

  // Confirmation + self-service cancel link to the guest.
  if (email && cancelToken) {
    const baseUrl = requestBaseUrl();
    if (baseUrl) {
      await sendRsvpConfirmation({
        to: email,
        eventLabel: "the gathering in memory of Joe",
        name,
        detail: partySize > 1 ? `Party of ${partySize}` : undefined,
        cancelUrl: `${baseUrl}/rsvp/cancel?token=${cancelToken}&t=g`,
      });
    }
  }

  if (email && formData.get("subscribe") === "on") {
    try {
      const baseUrl = requestBaseUrl();
      const r = await addSubscriber(email);
      if (r.token && baseUrl) await sendSubscribeConfirmation(email, r.token, baseUrl);
    } catch (err) {
      console.error("[rsvpGathering] subscribe failed:", err);
    }
  }

  revalidatePath("/");
  return {
    ok: true,
    message:
      "Thank you — your RSVP is in. We're grateful you'll be there to remember Joe. 💛",
  };
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
