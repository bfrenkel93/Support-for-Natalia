import { adminPasswordIsSet, isAdmin } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured, type Slot } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import {
  deleteEvent,
  deleteGift,
  deleteSlot,
  logout,
  removePledge,
  removeRsvp,
  unclaimSlot,
} from "./actions";
import { attachSignedUrls, listMemories } from "@/lib/memories";
import { getEvents } from "@/lib/events";
import { getGifts } from "@/lib/gifts";
import LoginForm from "@/components/admin/LoginForm";
import SettingsForm from "@/components/admin/SettingsForm";
import AddSlotForm from "@/components/admin/AddSlotForm";
import AddEventForm from "@/components/admin/AddEventForm";
import AddGiftForm from "@/components/admin/AddGiftForm";
import MemoryList from "@/components/MemoryList";

export const dynamic = "force-dynamic";

const SECTION_TITLE: Record<Slot["category"], string> = {
  kids: "Visits for the Kids",
  support: "Support for Natalia",
};

export default async function AdminPage() {
  if (!isAdmin()) {
    return <LoginForm passwordSet={adminPasswordIsSet()} />;
  }

  const settings = await getSettings();
  const slots = await getAllSlots();
  const kids = slots.filter((s) => s.category === "kids");
  const support = slots.filter((s) => s.category === "support");
  const claimedCount = slots.filter((s) => s.claimed).length;

  const memories = await attachSignedUrls(await listMemories());
  const memoryPhotoCount = memories.reduce((n, m) => n + m.media.length, 0);
  const events = await getEvents();
  const gifts = await getGifts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-ink">Family admin</h1>
          <p className="mt-1 text-ink-soft">
            {slots.length} slots · {claimedCount} claimed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-sm text-sage-dark underline underline-offset-2"
          >
            View the page ↗
          </a>
          <form action={logout}>
            <button className="rounded-full border border-cream-deep px-4 py-2 text-sm text-ink-soft hover:bg-cream-deep/40">
              Log out
            </button>
          </form>
        </div>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 rounded-xl2 border border-clay/30 bg-clay/5 px-5 py-4 text-sm text-clay-dark">
          Supabase isn&apos;t connected yet, so changes can&apos;t be saved. Set
          <code> NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, then reload.
        </p>
      )}

      {/* Memories — private stories & photos for the kids */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl text-ink">
              Memories of Joe{" "}
              <span className="text-base font-normal text-ink-soft">
                (private)
              </span>
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {memories.length} shared · {memoryPhotoCount} photo
              {memoryPhotoCount === 1 ? "" : "s"} · visible only here
            </p>
          </div>
          {memories.length > 0 && (
            <a
              href="/api/memories/export"
              className="rounded-full border border-cream-deep px-4 py-2 text-sm text-ink-soft hover:bg-cream-deep/40"
            >
              Export stories ↓
            </a>
          )}
        </div>
        <div className="mt-4">
          <MemoryList memories={memories} />
        </div>
      </section>

      {/* Slots by section */}
      {(["kids", "support"] as const).map((category) => {
        const list = category === "kids" ? kids : support;
        return (
          <section key={category} className="mt-10">
            <h2 className="font-serif text-xl text-ink">
              {SECTION_TITLE[category]}
            </h2>
            <div className="mt-4 overflow-hidden rounded-xl2 border border-cream-deep">
              {list.length === 0 ? (
                <p className="bg-cream-soft px-5 py-6 text-ink-soft">
                  No slots yet — add one below.
                </p>
              ) : (
                <ul className="divide-y divide-cream-deep">
                  {list.map((slot) => (
                    <li
                      key={slot.id}
                      className="flex flex-col gap-3 bg-cream-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">
                          {slot.label ||
                            slot.event_date ||
                            "(no date/label)"}
                        </p>
                        {slot.description && (
                          <p className="text-sm text-ink-soft">
                            {slot.description}
                          </p>
                        )}
                        {slot.claimed ? (
                          <p className="mt-1 text-sm text-sage-dark">
                            ✓ {slot.claimed_name || "Claimed"}
                            {slot.claimed_email && ` · ${slot.claimed_email}`}
                            {slot.claimed_private && " · (private)"}
                            {slot.claimed_note && ` · “${slot.claimed_note}”`}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-ink-soft">Open</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {slot.claimed && (
                          <form action={unclaimSlot}>
                            <input type="hidden" name="id" value={slot.id} />
                            <button className="rounded-full border border-cream-deep px-3 py-1.5 text-sm text-ink-soft hover:bg-cream-deep/40">
                              Reopen
                            </button>
                          </form>
                        )}
                        <form action={deleteSlot}>
                          <input type="hidden" name="id" value={slot.id} />
                          <button className="rounded-full border border-clay/30 px-3 py-1.5 text-sm text-clay-dark hover:bg-clay/10">
                            Delete
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      {/* Events */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-ink">
          Events — Come Cheer Them On
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Games, recitals, milestones. Anyone can RSVP; names show on the page.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl2 border border-line">
          {events.length === 0 ? (
            <p className="bg-cream-soft px-5 py-6 text-ink-soft">
              No events yet — add one below.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {events.map((ev) => (
                <li key={ev.id} className="bg-cream-soft px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{ev.title}</p>
                      <p className="text-sm text-ink-soft">
                        {ev.event_date || "(no date)"}
                        {ev.event_time ? ` · ${ev.event_time}` : ""}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                    </div>
                    <form action={deleteEvent} className="shrink-0">
                      <input type="hidden" name="id" value={ev.id} />
                      <button className="rounded-full border border-clay/30 px-3 py-1.5 text-sm text-clay-dark hover:bg-clay/10">
                        Delete event
                      </button>
                    </form>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs uppercase tracking-wide text-ink-soft">
                      {ev.rsvps.length} coming
                    </p>
                    {ev.rsvps.length > 0 && (
                      <ul className="mt-1 flex flex-wrap gap-2">
                        {ev.rsvps.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-center gap-1.5 rounded-full bg-clay/10 px-2.5 py-1 text-sm text-clay-dark"
                          >
                            <span title={r.note || undefined}>{r.name}</span>
                            <form action={removeRsvp}>
                              <input type="hidden" name="id" value={r.id} />
                              <button
                                className="text-clay-dark/70 hover:text-clay-dark"
                                title="Remove"
                              >
                                ✕
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 rounded-xl2 border border-line bg-cream-soft p-5">
          <AddEventForm />
        </div>
      </section>

      {/* Gifts */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-ink">Gifts — Give a Gift</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Ideas like a private-chef week, a massage, or a manicure. Your Venmo,
          Cash App, and Zelle show at the top of this section — edit them under
          “Edit page text” below.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl2 border border-line">
          {gifts.length === 0 ? (
            <p className="bg-cream-soft px-5 py-6 text-ink-soft">
              No gifts yet — add one below.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {gifts.map((g) => {
                const total = g.pledges.reduce(
                  (s, p) => s + (p.amount || 0),
                  0
                );
                return (
                  <li key={g.id} className="bg-cream-soft px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">
                          {g.title}
                          {g.cost != null && (
                            <span className="ml-2 text-sm font-normal text-ink-soft">
                              goal ${g.cost.toLocaleString("en-US")}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-ink-soft">
                          {g.pledges.length} chipped in · $
                          {total.toLocaleString("en-US")} logged
                        </p>
                      </div>
                      <form action={deleteGift} className="shrink-0">
                        <input type="hidden" name="id" value={g.id} />
                        <button className="rounded-full border border-clay/30 px-3 py-1.5 text-sm text-clay-dark hover:bg-clay/10">
                          Delete gift
                        </button>
                      </form>
                    </div>
                    {g.pledges.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {g.pledges.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-1.5 rounded-full bg-sage-light/70 px-2.5 py-1 text-sm text-sage-dark"
                          >
                            <span title={p.note || undefined}>
                              {p.name}
                              {p.amount != null &&
                                ` · $${p.amount.toLocaleString("en-US")}`}
                            </span>
                            <form action={removePledge}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                className="text-sage-dark/70 hover:text-sage-dark"
                                title="Remove"
                              >
                                ✕
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-4 rounded-xl2 border border-line bg-cream-soft p-5">
          <AddGiftForm />
        </div>
      </section>

      {/* Add a slot */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-ink">Add a slot</h2>
        <div className="mt-4 rounded-xl2 border border-cream-deep bg-cream-soft p-5">
          <AddSlotForm />
        </div>
      </section>

      {/* Edit text */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-ink">Edit page text</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Change the intro, section copy, and footer — no code needed.
        </p>
        <div className="mt-4 rounded-xl2 border border-cream-deep bg-cream-soft p-5">
          <SettingsForm settings={settings} />
        </div>
      </section>

      <div className="h-16" />
    </div>
  );
}

async function getAllSlots(): Promise<Slot[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("event_date", { ascending: true });
  if (error || !data) return [];
  return data as Slot[];
}
