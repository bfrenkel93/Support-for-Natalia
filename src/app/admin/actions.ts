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

  const { error } = await supabase
    .from("settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    console.error("[saveSettings]", error);
    return { ok: false, message: "Couldn't save. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Saved. Your changes are live. 💛" };
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
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
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

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Event added." };
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
