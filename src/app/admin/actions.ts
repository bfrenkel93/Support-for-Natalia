"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  clearAdminCookie,
  isAdmin,
  setAdminCookie,
} from "@/lib/auth";
import { getSupabase, type Booking } from "@/lib/supabase";
import { deleteMemoryEverywhere } from "@/lib/memories";
import { sendRequestDecision } from "@/lib/email";
import { headers } from "next/headers";
import { ingestEvents } from "@/lib/weekend/ingest";
import { getGatheringRsvps } from "@/lib/gathering";
import {
  sendGatheringList,
  sendSubscriberEventBlast,
  sendSubscriberDigest,
  sendTestNotification,
  sendEmail,
  notifyList,
} from "@/lib/email";
import { getActiveSubscribers } from "@/lib/subscribers";

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
import { buildHighlights } from "@/lib/digest";

function adminBaseUrl(): string {
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

function prettyEventDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export type AdminState = { ok: boolean; message: string };

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---- Auth ----------------------------------------------------------

export async function login(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const password = String(formData.get("password") || "");
  if (!checkPassword(password)) {
    return { ok: false, message: "That password didn't match. Try again." };
  }
  setAdminCookie();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  clearAdminCookie();
  redirect("/admin");
}

function requireAdmin() {
  if (!isAdmin()) {
    throw new Error("Not authorized");
  }
}

// ---- Settings ------------------------------------------------------

export async function saveSettings(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Database isn't connected." };

  const rows: { key: string; value: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("setting__")) {
      rows.push({ key: key.replace("setting__", ""), value: String(value) });
    }
  }

  if (rows.length === 0) return { ok: false, message: "Nothing to save." };

  let error: unknown = null;
  try {
    const res = await supabase.from("settings").upsert(rows, { onConflict: "key" });
    error = res.error;
  } catch (e) {
    error = e;
  }

  if (error) {
    console.error("[saveSettings]", error);
    const e = error as { code?: string; message?: string; details?: string; hint?: string };
    const detail = [e.code, e.message, e.details, e.hint].filter(Boolean).join(" · ");
    return {
      ok: false,
      message: detail
        ? `Couldn't save — please try again. (${detail})`
        : "Couldn't save. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Saved. Your changes are live. 💛" };
}

// ---- Close / reopen the page ---------------------------------------

export async function setPageClosed(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const close = String(formData.get("close") || "") === "true";
  await supabase
    .from("settings")
    .upsert({ key: "page_closed", value: close ? "true" : "" }, { onConflict: "key" });
  revalidatePath("/");
  revalidatePath("/admin");
}

// ---- Bookings (the shared calendar) --------------------------------

export async function deleteBooking(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("bookings").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function confirmBooking(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", id)
    .select()
    .single();

  const b = data as Booking | null;
  if (b?.email) {
    await sendRequestDecision({
      to: b.email,
      confirmed: true,
      dateLabel: prettyDate(b.event_date),
      kind: b.kind,
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function declineBooking(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  const note = String(formData.get("note") || "").trim() || null;

  const { data } = await supabase
    .from("bookings")
    .update({ status: "declined" })
    .eq("id", id)
    .select()
    .single();

  const b = data as Booking | null;
  if (b?.email) {
    await sendRequestDecision({
      to: b.email,
      confirmed: false,
      dateLabel: prettyDate(b.event_date),
      note,
      kind: b.kind,
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

// ---- Gathering RSVPs -----------------------------------------------

export async function deleteGatheringRsvp(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("gathering_rsvps").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function emailGatheringList(
  _prev: AdminState,
  _formData: FormData
): Promise<AdminState> {
  requireAdmin();
  const { rows, total } = await getGatheringRsvps();
  if (rows.length === 0) {
    return { ok: false, message: "No RSVPs to send yet." };
  }
  const result = await sendGatheringList({ rows, total });
  if (!result.ok) {
    return { ok: false, message: result.reason || "Couldn't send the list." };
  }
  return { ok: true, message: `Sent — ${total} attending across ${rows.length} RSVPs.` };
}

export async function sendTestEmail(
  _prev: AdminState,
  _formData: FormData
): Promise<AdminState> {
  requireAdmin();
  const r = await sendTestNotification();
  if (r.to.length === 0) {
    return {
      ok: false,
      message:
        "No notification email is set. Add NOTIFY_EMAIL in Vercel (Production) and redeploy.",
    };
  }
  if (r.ok) {
    return {
      ok: true,
      message: `Sent to ${r.to.join(", ")} (from ${r.from}). Check your inbox — and spam, just in case.`,
    };
  }
  return {
    ok: false,
    message: `Resend rejected it → ${r.error} · from: ${r.from} · to: ${r.to.join(", ")}`,
  };
}

// ---- Message everyone (RSVP-ers + subscribers) ---------------------

export async function messageEveryone(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  requireAdmin();

  const subject =
    String(formData.get("subject") || "").replace(/\s+/g, " ").trim().slice(0, 200) ||
    "Joe’s memorial — changes to the event, please read";
  const message = String(formData.get("message") || "").trim().slice(0, 8000);
  if (!message) return { ok: false, message: "Please write a message first." };

  // Merge everyone who RSVP'd (and left an email) with active subscribers,
  // de-duplicated so no one gets it twice.
  const [{ rows }, subs] = await Promise.all([
    getGatheringRsvps(),
    getActiveSubscribers(),
  ]);
  const emails = new Set<string>();
  for (const r of rows) {
    const e = (r.email || "").trim().toLowerCase();
    if (e) emails.add(e);
  }
  for (const s of subs) {
    const e = (s.email || "").trim().toLowerCase();
    if (e) emails.add(e);
  }
  const list = Array.from(emails);
  if (list.length === 0) {
    return { ok: false, message: "No email addresses on file yet." };
  }

  // Send one email, everyone on BCC so addresses stay private. A copy goes to
  // the organizer's inbox (the visible "to"); replies come back to them.
  const organizer = notifyList();
  const to = organizer.length ? organizer : [list[0]];
  const replyTo = organizer[0];

  // A recognizable sender name so it doesn't read as spam. Reuses the verified
  // sending address from RESEND_FROM, just with a clearer display name.
  const rawFrom = process.env.RESEND_FROM || "notifications@familygriefsupport.org";
  const addrMatch = rawFrom.match(/<([^>]+)>/);
  const sendAddress = addrMatch ? addrMatch[1] : rawFrom.trim();
  const from = `Joe’s Memorial <${sendAddress}>`;

  const footer =
    "You're receiving this because you RSVP'd to Joe's memorial or asked to follow updates.";
  const html = `<div style="font-family: Georgia, serif; color:#3E3A33; line-height:1.7; font-size:16px;">
    ${escapeHtmlText(message).replace(/\n/g, "<br>")}
    <p style="color:#9A9082; font-size:13px; margin-top:22px;">${footer} 💛</p>
  </div>`;

  const r = await sendEmail({
    from,
    to,
    bcc: list,
    replyTo,
    subject,
    text: `${message}\n\n${footer}`,
    html,
  });

  if (!r.ok) {
    return { ok: false, message: `Couldn't send — ${r.error}` };
  }
  return {
    ok: true,
    message: `Sent to ${list.length} ${list.length === 1 ? "person" : "people"} (RSVP-ers + subscribers, no duplicates).`,
  };
}

// ---- Subscribers ("stay involved" updates) -------------------------

export async function sendUpdateNow(
  _prev: AdminState,
  _formData: FormData
): Promise<AdminState> {
  requireAdmin();
  const subs = await getActiveSubscribers();
  if (subs.length === 0) return { ok: false, message: "No subscribers yet." };
  const baseUrl = adminBaseUrl();
  if (!baseUrl) return { ok: false, message: "Couldn't determine the site URL." };
  const highlights = await buildHighlights();
  const sent = await sendSubscriberDigest(
    subs.map((s) => ({ email: s.email, token: s.token })),
    baseUrl,
    highlights
  );
  if (sent === 0) {
    return { ok: false, message: "Nothing sent — is email set up (Resend)?" };
  }
  return { ok: true, message: `Update sent to ${sent} subscriber${sent === 1 ? "" : "s"}.` };
}

export async function deleteSubscriber(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("subscribers").delete().eq("id", id);
  revalidatePath("/admin");
}

// ---- Weekend Ideas: automated events cache -------------------------

export async function refreshEventsNow(): Promise<void> {
  requireAdmin();
  await ingestEvents();
  revalidatePath("/");
  revalidatePath("/weekend-ideas");
  revalidatePath("/admin");
}

async function setEventFlag(
  formData: FormData,
  field: "is_hidden" | "is_featured",
  value: boolean
): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("family_events").update({ [field]: value }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/weekend-ideas");
  revalidatePath("/admin");
}

export async function hideEvent(formData: FormData): Promise<void> {
  await setEventFlag(formData, "is_hidden", true);
}
export async function unhideEvent(formData: FormData): Promise<void> {
  await setEventFlag(formData, "is_hidden", false);
}
export async function pinEvent(formData: FormData): Promise<void> {
  await setEventFlag(formData, "is_featured", true);
}
export async function unpinEvent(formData: FormData): Promise<void> {
  await setEventFlag(formData, "is_featured", false);
}

// ---- Activity ideas ------------------------------------------------

export async function addIdea(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Database isn't connected." };

  const title = String(formData.get("title") || "").trim();
  const event_date = String(formData.get("event_date") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const url = String(formData.get("url") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;
  const sort_order = Number(formData.get("sort_order") || 0) || 0;

  if (!title) return { ok: false, message: "Give the idea a name." };

  const { error } = await supabase
    .from("activity_ideas")
    .insert({ title, event_date, location, url, note, sort_order });

  if (error) {
    console.error("[addIdea]", error);
    return { ok: false, message: "Couldn't add that idea." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Idea added." };
}

export async function deleteIdea(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("activity_ideas").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

// ---- Events --------------------------------------------------------

export async function addEvent(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Database isn't connected." };

  const title = String(formData.get("title") || "").trim();
  const event_date = String(formData.get("event_date") || "").trim() || null;
  const event_time = String(formData.get("event_time") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const sort_order = Number(formData.get("sort_order") || 0) || 0;

  if (!title) return { ok: false, message: "Give the event a name." };

  const { error } = await supabase.from("events").insert({
    title,
    event_date,
    event_time,
    location,
    description,
    sort_order,
  });

  if (error) {
    console.error("[addEvent]", error);
    return { ok: false, message: "Couldn't add that event." };
  }

  // Let subscribers know a new way to show up just went up.
  let blast = 0;
  try {
    const subs = await getActiveSubscribers();
    const baseUrl = adminBaseUrl();
    if (subs.length > 0 && baseUrl) {
      blast = await sendSubscriberEventBlast(
        subs.map((s) => ({ email: s.email, token: s.token })),
        baseUrl,
        {
          title,
          whenText: event_date ? prettyEventDate(event_date) : "Date to be announced",
          location,
          description,
        }
      );
    }
  } catch (err) {
    console.error("[addEvent] subscriber blast failed:", err);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return {
    ok: true,
    message: blast > 0 ? `Event added · ${blast} subscribers notified.` : "Event added.",
  };
}

export async function deleteEvent(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeRsvp(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("event_rsvps").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

// ---- Gifts ---------------------------------------------------------

export async function addGift(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Database isn't connected." };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const link = String(formData.get("link") || "").trim() || null;
  const sort_order = Number(formData.get("sort_order") || 0) || 0;
  const costRaw = String(formData.get("cost") || "").trim();
  let cost: number | null = null;
  if (costRaw) {
    const parsed = Number(costRaw.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed >= 0) cost = parsed || null;
  }

  if (!title) return { ok: false, message: "Give the gift a name." };

  const { error } = await supabase
    .from("gifts")
    .insert({ title, description, cost, link, sort_order });

  if (error) {
    console.error("[addGift]", error);
    return { ok: false, message: "Couldn't add that gift." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Gift added." };
}

export async function deleteGift(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("gifts").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removePledge(formData: FormData): Promise<void> {
  requireAdmin();
  const supabase = getSupabase();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("gift_pledges").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteMemory(formData: FormData): Promise<void> {
  requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deleteMemoryEverywhere(id);
  revalidatePath("/admin");
}
