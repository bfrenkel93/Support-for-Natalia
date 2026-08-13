import { adminPasswordIsSet, isAdmin } from "@/lib/auth";
import { notifyList, organizerList } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { getBookings, KIND_LABEL } from "@/lib/bookings";
import { getActivityIdeas } from "@/lib/ideas";
import { getEvents } from "@/lib/events";
import { getGifts } from "@/lib/gifts";
import { attachSignedUrls, listMemories } from "@/lib/memories";
import { getEventsStatus, getAdminEvents } from "@/lib/weekend/cache";
import { getGatheringRsvps } from "@/lib/gathering";
import { getAllSubscribers } from "@/lib/subscribers";
import {
  confirmBooking,
  declineBooking,
  deleteBooking,
  deleteEvent,
  deleteGift,
  deleteGatheringRsvp,
  deleteIdea,
  hideEvent,
  logout,
  pinEvent,
  refreshEventsNow,
  removePledge,
  removeRsvp,
  deleteSubscriber,
  unhideEvent,
  unpinEvent,
} from "./actions";
import EmailGatheringListButton from "@/components/admin/EmailGatheringListButton";
import SendTestEmailButton from "@/components/admin/SendTestEmailButton";
import SendUpdateButton from "@/components/admin/SendUpdateButton";
import LoginForm from "@/components/admin/LoginForm";
import SettingsForm from "@/components/admin/SettingsForm";
import AddEventForm from "@/components/admin/AddEventForm";
import AddGiftForm from "@/components/admin/AddGiftForm";
import AddIdeaForm from "@/components/admin/AddIdeaForm";
import MemoryList from "@/components/MemoryList";

export const dynamic = "force-dynamic";

function fmt(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const H2 = "font-serif text-2xl font-light text-ink";
const CARD = "mt-4 overflow-hidden rounded-sm border border-line";
const PANEL = "mt-4 rounded-sm border border-line bg-bone/40 p-5";
const DEL =
  "rounded-sm border border-line-strong px-3 py-1.5 text-[0.68rem] uppercase tracking-wide text-ink-soft hover:bg-bone";

export default async function AdminPage() {
  if (!isAdmin()) {
    return <LoginForm passwordSet={adminPasswordIsSet()} />;
  }

  const [settings, bookings, ideas, events, gifts, memories, eventsStatus, cachedEvents, gathering] =
    await Promise.all([
      getSettings(),
      getBookings(),
      getActivityIdeas(),
      getEvents(),
      getGifts(),
      listMemories().then(attachSignedUrls),
      getEventsStatus(),
      getAdminEvents(),
      getGatheringRsvps(),
    ]);
  const subscribers = await getAllSubscribers();
  const activeSubs = subscribers.filter((s) => !s.unsubscribed_at);

  const pending = bookings.filter((b) => b.status === "requested");
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const memoryPhotoCount = memories.reduce((n, m) => n + m.media.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Private dashboard</p>
          <h1 className="font-serif text-3xl font-light text-ink">Family admin</h1>
        </div>
        <div className="flex items-center gap-5">
          <a href="/admin/impact" className="btn-link">Impact ↗</a>
          <a href="/" className="btn-link">View the page ↗</a>
          <form action={logout}>
            <button className={DEL}>Log out</button>
          </form>
        </div>
      </div>

      {(() => {
        const alertsTo = notifyList();
        const organizerTo = organizerList();
        return (
          <div
            className={`mt-6 border-l-2 px-5 py-4 text-sm ${
              alertsTo.length
                ? "border-bronze/50 bg-bone/40 text-ink-soft"
                : "border-red-500 bg-red-50 text-red-800"
            }`}
          >
            {alertsTo.length ? (
              <>
                <p>
                  Food, visits, kids, events, gifts &amp; memories are sent to:{" "}
                  <strong className="text-ink">{alertsTo.join(", ")}</strong>
                </p>
                <p className="mt-1">
                  Memorial (Gathering) RSVPs go to you only:{" "}
                  <strong className="text-ink">
                    {organizerTo.join(", ") || "—"}
                  </strong>
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  Not arriving? Send a test (goes to you only) — if Resend
                  rejects it, the exact reason shows here.
                </p>
                <SendTestEmailButton />
              </>
            ) : (
              <p>
                ⚠️ No notification email is set, so you won&apos;t get sign-up or
                RSVP alerts. Add <code>NOTIFY_EMAIL</code> in your Vercel
                environment variables (Production), then redeploy.
              </p>
            )}
          </div>
        );
      })()}

      {!isSupabaseConfigured() && (
        <p className="mt-6 border-l-2 border-bronze/50 bg-bone/60 px-5 py-4 text-sm text-ink-soft">
          Supabase isn&apos;t connected yet, so changes can&apos;t be saved. Set{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, then reload.
        </p>
      )}

      {/* Gathering RSVPs */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={H2}>
              The Gathering — RSVPs
              <span className="ml-3 align-middle text-sm text-bronze">
                {gathering.total} attending · {gathering.parties} RSVP
                {gathering.parties === 1 ? "" : "s"}
              </span>
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Total headcount for the memorial. Each RSVP also emails you as it
              comes in.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {gathering.rows.length > 0 && (
              <>
                <EmailGatheringListButton />
                <a href="/api/gathering/export" className={DEL}>
                  Export CSV ↓
                </a>
              </>
            )}
          </div>
        </div>
        <div className={CARD}>
          {gathering.rows.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">No RSVPs yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {gathering.rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 bg-bone/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {r.name}
                      <span className="ml-2 text-sm font-normal text-ink-soft">
                        party of {r.party_size}
                      </span>
                    </p>
                    <p className="text-sm text-ink-soft">
                      {r.email || "—"}
                      {r.note ? ` · “${r.note}”` : ""}
                    </p>
                  </div>
                  <form action={deleteGatheringRsvp} className="shrink-0">
                    <input type="hidden" name="id" value={r.id} />
                    <button className={DEL}>Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Visit & weekend requests awaiting confirmation */}
      <section className="mt-12">
        <h2 className={H2}>
          Requests to approve
          {pending.length > 0 && (
            <span className="ml-3 align-middle text-sm text-bronze">
              {pending.length} awaiting you
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Friends asking to visit or to spend a weekend with the kids. Confirm,
          or decline with a note suggesting another time (they&apos;ll get an
          email either way).
        </p>
        <div className={CARD}>
          {pending.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">
              No requests waiting right now.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {pending.map((b) => (
                <li key={b.id} className="bg-bone/40 px-5 py-4">
                  <p className="font-medium text-ink">
                    {b.name}
                    <span className="ml-2 text-sm font-normal text-ink-soft">
                      {KIND_LABEL[b.kind]} · {fmt(b.event_date)}
                    </span>
                  </p>
                  {b.email && <p className="text-sm text-ink-soft">{b.email}</p>}
                  {b.note && <p className="mt-1 text-sm italic text-ink-soft">“{b.note}”</p>}
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <form action={confirmBooking}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="btn">Confirm</button>
                    </form>
                    <form action={declineBooking} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={b.id} />
                      <input
                        name="note"
                        placeholder="Suggest another weekend (optional)"
                        className="field w-64 max-w-full"
                      />
                      <button className={DEL}>Decline</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Confirmed sign-ups on the calendar */}
      <section className="mt-12">
        <h2 className={H2}>Calendar sign-ups</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Everything currently on the shared calendar. Remove anything that
          changes.
        </p>
        <div className={CARD}>
          {confirmed.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">Nothing booked yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {confirmed.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col gap-2 bg-bone/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {fmt(b.event_date)} · {KIND_LABEL[b.kind]}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {b.private ? "Someone (private)" : b.name}
                      {b.email && ` · ${b.email}`}
                      {b.note && ` · “${b.note}”`}
                    </p>
                  </div>
                  <form action={deleteBooking} className="shrink-0">
                    <input type="hidden" name="id" value={b.id} />
                    <button className={DEL}>Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Ideas for time with the kids */}
      <section className="mt-12">
        <h2 className={H2}>Ideas for the kids</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Outings shown as inspiration in the “For the Kids” section.
        </p>
        <div className={CARD}>
          {ideas.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">No ideas yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {ideas.map((idea) => (
                <li
                  key={idea.id}
                  className="flex items-center justify-between gap-3 bg-bone/40 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{idea.title}</p>
                    <p className="text-sm text-ink-soft">
                      {idea.event_date ? `${fmt(idea.event_date)} · ` : ""}
                      {idea.location}
                    </p>
                  </div>
                  <form action={deleteIdea} className="shrink-0">
                    <input type="hidden" name="id" value={idea.id} />
                    <button className={DEL}>Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={PANEL}>
          <AddIdeaForm />
        </div>
      </section>

      {/* Weekend Ideas — automatic events cache */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={H2}>Weekend Ideas — automatic</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {eventsStatus.upcomingCount} upcoming special events cached ·
              refreshes weekly. You never add these by hand — just hide anything
              you don&apos;t want, or pin a favorite.
            </p>
          </div>
          <form action={refreshEventsNow}>
            <button className="btn">Refresh events now</button>
          </form>
        </div>

        <div className="mt-4 rounded-sm border border-line bg-bone/40 px-5 py-4 text-sm text-ink-soft">
          {eventsStatus.sources.length === 0 ? (
            <p>No refresh has run yet. Add a Ticketmaster key and click “Refresh events now.”</p>
          ) : (
            <ul className="space-y-1">
              {eventsStatus.sources.map((s) => (
                <li key={s.source}>
                  <span className="uppercase tracking-wide text-ink">{s.source}</span>{" "}
                  · {s.status}
                  {s.last_success_at
                    ? ` · last success ${new Date(s.last_success_at).toLocaleString("en-US")}`
                    : ""}
                  {s.error_message ? ` · ${s.error_message}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        {cachedEvents.length > 0 && (
          <div className={CARD}>
            <ul className="divide-y divide-line">
              {cachedEvents.map((e) => (
                <li
                  key={e.id}
                  className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    e.is_hidden ? "bg-bone/20 opacity-60" : "bg-bone/40"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {e.title}
                      {e.is_featured && (
                        <span className="ml-2 text-[0.62rem] uppercase tracking-wide text-bronze">
                          pinned
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {e.start_date ? fmt(e.start_date) : "(no date)"}
                      {e.venue ? ` · ${e.venue}` : ""} · q{e.quality_score}/f
                      {e.family_score}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={e.is_featured ? unpinEvent : pinEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className={DEL}>{e.is_featured ? "Unpin" : "Pin"}</button>
                    </form>
                    <form action={e.is_hidden ? unhideEvent : hideEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className={DEL}>{e.is_hidden ? "Unhide" : "Hide"}</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Memories */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={H2}>
              Memories of Joe{" "}
              <span className="text-base text-ink-soft">(private)</span>
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {memories.length} shared · {memoryPhotoCount} photo
              {memoryPhotoCount === 1 ? "" : "s"} · visible only here
            </p>
          </div>
          {memories.length > 0 && (
            <a href="/api/memories/export" className={DEL}>
              Export stories ↓
            </a>
          )}
        </div>
        <div className="mt-4">
          <MemoryList memories={memories} />
        </div>
      </section>

      {/* Events */}
      <section className="mt-12">
        <h2 className={H2}>Events — Come Cheer Them On</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Games, recitals, milestones. Anyone can RSVP; names show on the page.
        </p>
        <div className={CARD}>
          {events.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">No events yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {events.map((ev) => (
                <li key={ev.id} className="bg-bone/40 px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{ev.title}</p>
                      <p className="text-sm text-ink-soft">
                        {ev.event_date || "(no date)"}
                        {ev.event_time ? ` · ${ev.event_time}` : ""}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                    </div>
                    <form action={deleteEvent} className="shrink-0">
                      <input type="hidden" name="id" value={ev.id} />
                      <button className={DEL}>Delete event</button>
                    </form>
                  </div>
                  {ev.rsvps.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {ev.rsvps.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-1.5 rounded-sm bg-bone px-2.5 py-1 text-sm text-ink-soft"
                        >
                          <span title={r.note || undefined}>{r.name}</span>
                          <form action={removeRsvp}>
                            <input type="hidden" name="id" value={r.id} />
                            <button className="text-ink-faint hover:text-bronze" title="Remove">
                              ✕
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={PANEL}>
          <AddEventForm />
        </div>
      </section>

      {/* Gifts */}
      <section className="mt-12">
        <h2 className={H2}>Gifts — Give a Gift</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Your Venmo, Cash App, and Zelle show at the top of that section — edit
          them under “Edit page text” below.
        </p>
        <div className={CARD}>
          {gifts.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">No gifts yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {gifts.map((g) => {
                const total = g.pledges.reduce((s, p) => s + (p.amount || 0), 0);
                return (
                  <li key={g.id} className="bg-bone/40 px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
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
                        <button className={DEL}>Delete gift</button>
                      </form>
                    </div>
                    {g.pledges.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {g.pledges.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-1.5 rounded-sm bg-bone px-2.5 py-1 text-sm text-ink-soft"
                          >
                            <span title={p.note || undefined}>
                              {p.name}
                              {p.amount != null && ` · $${p.amount.toLocaleString("en-US")}`}
                            </span>
                            <form action={removePledge}>
                              <input type="hidden" name="id" value={p.id} />
                              <button className="text-ink-faint hover:text-bronze" title="Remove">
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
        <div className={PANEL}>
          <AddGiftForm />
        </div>
      </section>

      {/* Subscribers */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={H2}>
              Subscribers
              <span className="ml-3 align-middle text-sm text-bronze">
                {activeSubs.length} active
              </span>
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              They get a warm update every ~2 months and whenever you post a new
              event. Send one now anytime.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeSubs.length > 0 && <SendUpdateButton />}
            {subscribers.length > 0 && (
              <a href="/api/subscribers/export" className={DEL}>
                Export CSV ↓
              </a>
            )}
          </div>
        </div>
        <div className={CARD}>
          {subscribers.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">No subscribers yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {subscribers.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 bg-bone/40 px-5 py-3"
                >
                  <span className="min-w-0">
                    <span className="text-ink">{s.email}</span>
                    {s.unsubscribed_at && (
                      <span className="ml-2 text-[0.62rem] uppercase tracking-wide text-ink-faint">
                        unsubscribed
                      </span>
                    )}
                  </span>
                  <form action={deleteSubscriber} className="shrink-0">
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-ink-faint hover:text-bronze" title="Remove">
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Edit text */}
      <section className="mt-12">
        <h2 className={H2}>Edit page text</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Change the intro, section copy, payment handles, photo, and footer — no
          code needed.
        </p>
        <div className={PANEL}>
          <SettingsForm settings={settings} />
        </div>
      </section>

      <div className="h-16" />
    </div>
  );
}
