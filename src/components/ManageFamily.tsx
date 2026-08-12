"use client";

import { useState, type FormEvent } from "react";
import GiftManager from "./GiftManager";
import EventManager from "./EventManager";
import MessageAssist, { type AiContext } from "./MessageAssist";

type FamilyLite = {
  slug: string;
  display_name: string;
  honoring: string | null;
  town: string | null;
  has_kids: boolean;
  is_public: boolean;
  access_code: string;
  contact_email: string;
  edit_token: string;
  hero_image_url: string | null;
  eyebrow: string;
  relationship: string;
  intro_message: string;
  memories_public: boolean;
  memorial_title: string;
  memorial_intro: string;
  memorial_when: string;
  memorial_where: string;
  memorial_note: string;
  gifts_intro: string;
  pay_venmo: string;
  pay_cashapp: string;
  pay_zelle: string;
  show_calendar: boolean;
  show_memorial: boolean;
  show_gifts: boolean;
  show_subscribe: boolean;
  show_memories: boolean;
  show_events: boolean;
  support_name: string;
  support_address: string;
  support_note: string;
  show_support: boolean;
};

type GiftRow = {
  id: string;
  title: string;
  description: string | null;
  cost: number | null;
};

type EventRow = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
};

type BookingLite = {
  event_date: string;
  kind: string;
  name: string;
  private: boolean;
};

type MemoryLite = {
  id: string;
  author_name: string | null;
  story: string | null;
  created_at: string;
  photos: string[];
};

const REL_OPTIONS = [
  "father", "mother", "husband", "wife", "partner", "son", "daughter",
  "brother", "sister", "grandfather", "grandmother", "friend",
];

const KIND_SHORT: Record<string, string> = {
  meal: "Meal",
  visit: "Visit",
  errand: "Errand",
  kids: "With the kids",
};

function pretty(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

// Editable "standard message" starting points. These pre-fill the message
// fields by default so a family is never staring at a blank box.
function mkIntro(who: string): string {
  return who
    ? `In the wake of losing ${who}, so many people have wanted to know how to show up for this family — and haven’t always known how.\n\nThere is no way to fill the space that’s been left behind. But there are ways to surround them with presence, consistency, and care.\n\nThis page is simply a way to do that together — meals, visits, a hand with everyday life, and memories worth keeping — for as long as it takes.`
    : `After a loss, so many people want to show up for the family — and don’t always know how.\n\nThere is no way to fill the space that’s been left behind. But there are ways to surround them with presence, consistency, and care.\n\nThis page is simply a way to do that together — meals, visits, a hand with everyday life, and memories worth keeping — for as long as it takes.`;
}
function mkMemorial(who: string): string {
  return who
    ? `We’ll be gathering to remember ${who} and to hold one another close. If ${who} touched your life, you are warmly welcome — come just as you are.\n\nThere’s nothing you need to bring but yourself, and, if you’d like, a memory to share.`
    : `We’ll be gathering to remember someone dear to us and to hold one another close. If they touched your life, you are warmly welcome — come just as you are.\n\nThere’s nothing you need to bring but yourself, and, if you’d like, a memory to share.`;
}
function mkGift(): string {
  return `If you’d like to help in a more tangible way, anything shared here goes directly to the family — for meals, everyday costs, or simply a little breathing room. There’s no expected amount, and every bit is felt.`;
}

export default function ManageFamily({
  family,
  bookings,
  memories,
  subscriberCount,
  gatheringTotal,
  gatheringParties,
  gifts,
  events,
}: {
  family: FamilyLite;
  bookings: BookingLite[];
  memories: MemoryLite[];
  subscriberCount: number;
  gatheringTotal: number;
  gatheringParties: number;
  gifts: GiftRow[];
  events: EventRow[];
}) {
  const [displayName, setDisplayName] = useState(family.display_name);
  const [honoring, setHonoring] = useState(family.honoring || "");
  const [relationships, setRelationships] = useState<string[]>(
    (family.relationship || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  const toggleRel = (r: string) =>
    setRelationships((cur) =>
      cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]
    );
  const [eyebrow, setEyebrow] = useState(family.eyebrow || "");
  const [town, setTown] = useState(family.town || "");
  const [hasKids, setHasKids] = useState(family.has_kids);
  const [isPublic, setIsPublic] = useState(family.is_public);
  const [accessCode, setAccessCode] = useState(family.access_code || "");
  const [contactEmail, setContactEmail] = useState(family.contact_email || "");
  const [introMessage, setIntroMessage] = useState(
    family.intro_message || mkIntro((family.honoring || "").trim())
  );
  const [memoriesPublic, setMemoriesPublic] = useState(family.memories_public);
  const [supportName, setSupportName] = useState(family.support_name);
  const [supportAddress, setSupportAddress] = useState(family.support_address);
  const [supportNote, setSupportNote] = useState(family.support_note);
  const [showSupport, setShowSupport] = useState(family.show_support);

  const [memTitle, setMemTitle] = useState(family.memorial_title);
  const [memIntro, setMemIntro] = useState(
    family.memorial_intro || mkMemorial((family.honoring || "").trim())
  );
  const [memWhen, setMemWhen] = useState(family.memorial_when);
  const [memWhere, setMemWhere] = useState(family.memorial_where);
  const [memNote, setMemNote] = useState(family.memorial_note);

  const [giftsIntro, setGiftsIntro] = useState(family.gifts_intro || mkGift());
  const [payVenmo, setPayVenmo] = useState(family.pay_venmo);
  const [payCashapp, setPayCashapp] = useState(family.pay_cashapp);
  const [payZelle, setPayZelle] = useState(family.pay_zelle);

  const [showCalendar, setShowCalendar] = useState(family.show_calendar);
  const [showMemorial, setShowMemorial] = useState(family.show_memorial);
  const [showGifts, setShowGifts] = useState(family.show_gifts);
  const [showSubscribe, setShowSubscribe] = useState(family.show_subscribe);
  const [showMemories, setShowMemories] = useState(family.show_memories);
  const [showEvents, setShowEvents] = useState(family.show_events);

  const [heroUrl, setHeroUrl] = useState<string | null>(family.hero_image_url);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const pageUrl = `/${family.slug}`;

  // Shared context handed to the AI drafting helper.
  const aiContext: AiContext = { displayName, honoring, town, hasKids };
  const who = honoring.trim();
  const introTemplate = mkIntro(who);
  const memorialTemplate = mkMemorial(who);
  const giftTemplate = mkGift();

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    try {
      const fd = new FormData();
      fd.append("token", family.edit_token);
      fd.append("file", file);
      const res = await fetch("/api/manage/hero", { method: "POST", body: fd });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setHeroUrl(out.url);
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setUploadErr(m && m !== "bad" ? m : "Couldn't upload that photo. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveErr("");
    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: family.edit_token,
          displayName,
          honoring,
          relationship: REL_OPTIONS.filter((r) => relationships.includes(r)).join(", "),
          eyebrow,
          town,
          hasKids,
          isPublic,
          accessCode,
          contactEmail,
          introMessage,
          memoriesPublic,
          memorialTitle: memTitle,
          memorialIntro: memIntro,
          memorialWhen: memWhen,
          memorialWhere: memWhere,
          memorialNote: memNote,
          giftsIntro,
          payVenmo,
          payCashapp,
          payZelle,
          showCalendar,
          showMemorial,
          showGifts,
          showSubscribe,
          showMemories,
          showEvents,
          supportName,
          supportAddress,
          supportNote,
          showSupport,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setSaved(true);
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setSaveErr(m && m !== "bad" ? m : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-6">
        <div>
          <p className="eyebrow">Manage your page</p>
          <h1 className="mt-1 font-serif text-3xl font-light text-ink">{displayName}</h1>
        </div>
        <a href={pageUrl} className="btn-ghost" target="_blank" rel="noreferrer">
          View page ↗
        </a>
      </div>

      {/* Hero photo */}
      <section className="mt-10">
        <p className="field-label">Hero photo</p>
        <div className="mt-2 overflow-hidden rounded-sm border border-line bg-bone/40">
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt="" className="h-56 w-full object-cover sm:h-72" />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-ink-faint">
              No photo yet
            </div>
          )}
        </div>
        <label className="btn-ghost mt-3 cursor-pointer">
          {uploading ? "Uploading…" : heroUrl ? "Change photo" : "Upload a photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={onPhoto}
            disabled={uploading}
          />
        </label>
        {uploadErr && <p className="mt-2 text-sm text-bronze">{uploadErr}</p>}
      </section>

      {/* Details */}
      <form onSubmit={onSave} className="mt-12">
        <p className="eyebrow">Page details</p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="field-label">Name of the person who died</label>
            <input className="field" value={honoring} onChange={(e) => setHonoring(e.target.value)} maxLength={200} placeholder="e.g. Joe" />
          </div>
          <div>
            <label className="field-label">Town or city</label>
            <input className="field" value={town} onChange={(e) => setTown(e.target.value)} maxLength={200} placeholder="e.g. Newton, MA" />
          </div>
          <div>
            <label className="field-label">Page title</label>
            <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={200} placeholder="Defaults to their name" />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">They were a… <span className="text-ink-faint">(check all that fit)</span></label>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
              {REL_OPTIONS.map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={relationships.includes(r)}
                    onChange={() => toggleRel(r)}
                    className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40"
                  />
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Small line above the name</label>
            <input className="field" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} maxLength={120} placeholder={honoring ? `For the people who love ${honoring}` : "For the people who love them"} />
            <p className="mt-1.5 text-xs text-ink-faint">
              Leave blank for the default. Or make it your own — e.g. “For the kids,” “For those left behind.”
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="field-label">Notification email</label>
          <input
            type="email"
            className="field"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            maxLength={200}
            placeholder="name@email.com"
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            Every meal sign-up, RSVP, and shared memory is sent here — use the
            grieving family member’s address so it reaches them. You can add more
            than one, separated by commas.
          </p>
        </div>

        <div className="mt-6">
          <MessageAssist
            label="Your opening message"
            value={introMessage}
            onChange={setIntroMessage}
            token={family.edit_token}
            kind="intro"
            context={aiContext}
            template={introTemplate}
            notesHelp="Share a few words about who you’re honoring — a name, what they were like, anything at all. Or leave it blank and we’ll start from the basics."
            notesPlaceholder="e.g. Joe was a dad of two who coached little league and made the best pancakes…"
            maxLength={6000}
            minHeightClass="min-h-[9rem]"
          />
        </div>

        <label className="mt-5 flex items-center gap-2.5 text-sm text-ink-soft">
          <input type="checkbox" checked={hasKids} onChange={(e) => setHasKids(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
          There are children in the family (adds “time with the kids”)
        </label>

        <div className="mt-8">
          <p className="field-label">Who can see this page?</p>
          <div className="mt-2 space-y-2 text-sm text-ink">
            <label className="flex items-center gap-2.5">
              <input type="radio" name="vis" checked={!isPublic} onChange={() => setIsPublic(false)} className="text-bronze focus:ring-bronze/40" />
              Private — only people with the link
            </label>
            <label className="flex items-center gap-2.5">
              <input type="radio" name="vis" checked={isPublic} onChange={() => setIsPublic(true)} className="text-bronze focus:ring-bronze/40" />
              Public — listed and findable
            </label>
          </div>

          <div className="mt-5">
            <label className="field-label">Access code — optional</label>
            <input
              className="field"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              maxLength={100}
              placeholder="e.g. a word or number only your circle knows"
              autoComplete="off"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Set a code and visitors must enter it to see the page — a simple lock
              for the link. Leave blank for no code.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-line/60 pt-8">
          <p className="eyebrow">Sections on your page</p>
          <p className="mt-1 text-sm text-ink-faint">
            Show only what your family needs — uncheck anything to hide it.
          </p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={showCalendar} onChange={(e) => setShowCalendar(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
              Sign-up calendar (meals, visits, help)
            </label>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={showMemorial} onChange={(e) => setShowMemorial(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
              Memorial gathering
            </label>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={showGifts} onChange={(e) => setShowGifts(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
              Give a gift
            </label>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={showSubscribe} onChange={(e) => setShowSubscribe(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
              Stay involved (email updates)
            </label>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={showMemories} onChange={(e) => setShowMemories(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
              Memories &amp; stories
            </label>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
              Come cheer them on (events)
            </label>
          </div>
        </div>

        <div className="mt-10 border-t border-line/60 pt-8">
          <p className="eyebrow">When a memory is shared</p>
          <p className="mt-1 text-sm text-ink-faint">
            Choose what happens when someone shares a story or photo.
          </p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            <label className="flex items-start gap-2.5">
              <input type="radio" name="memvis" checked={!memoriesPublic} onChange={() => setMemoriesPublic(false)} className="mt-1 text-bronze focus:ring-bronze/40" />
              <span>
                Keep it private — sent to your notification email, and visible
                only to you here on this page.
              </span>
            </label>
            <label className="flex items-start gap-2.5">
              <input type="radio" name="memvis" checked={memoriesPublic} onChange={() => setMemoriesPublic(true)} className="mt-1 text-bronze focus:ring-bronze/40" />
              <span>
                Post it on your page — shared stories appear for everyone who
                visits (you’re still emailed each one).
              </span>
            </label>
          </div>
        </div>

        <div className="mt-10 border-t border-line/60 pt-8">
          <p className="eyebrow">Memorial gathering — optional</p>
          <p className="mt-1 text-sm text-ink-faint">
            Fill this in to show a memorial section with RSVPs on your page.
            Leave it blank to hide it.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="field-label">Title</label>
              <input className="field" value={memTitle} onChange={(e) => setMemTitle(e.target.value)} maxLength={200} placeholder="e.g. A Celebration of Joe’s Life" />
            </div>
            <div>
              <label className="field-label">When</label>
              <input className="field" value={memWhen} onChange={(e) => setMemWhen(e.target.value)} maxLength={200} placeholder="e.g. Saturday, Oct 4 at 2pm" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Where</label>
              <input className="field" value={memWhere} onChange={(e) => setMemWhere(e.target.value)} maxLength={300} placeholder="Address or place" />
            </div>
          </div>
          <div className="mt-6">
            <MessageAssist
              label="Invitation message"
              value={memIntro}
              onChange={setMemIntro}
              token={family.edit_token}
              kind="memorial"
              context={aiContext}
              template={memorialTemplate}
              notesHelp="Anything you want people to know about the gathering — the tone, who’s welcome, what to expect. The date, time, and place are set in the fields above."
              notesPlaceholder="e.g. Casual gathering at our home, kids welcome, bring a story to share"
              maxLength={3000}
              minHeightClass="min-h-[6rem]"
            />
          </div>
          <div className="mt-6">
            <label className="field-label">A closing note — optional</label>
            <input className="field" value={memNote} onChange={(e) => setMemNote(e.target.value)} maxLength={2000} placeholder="e.g. More details to follow" />
          </div>
          {gatheringParties > 0 && (
            <p className="mt-4 text-sm text-ink-soft">
              {gatheringTotal} guests RSVP’d ({gatheringParties} responses).
            </p>
          )}
        </div>

        <div className="mt-10 border-t border-line/60 pt-8">
          <p className="eyebrow">Give a gift — optional</p>
          <p className="mt-1 text-sm text-ink-faint">
            An intro and where people can send money. Add the gift ideas
            themselves below.
          </p>
          <div className="mt-4">
            <MessageAssist
              label="Intro message"
              value={giftsIntro}
              onChange={setGiftsIntro}
              token={family.edit_token}
              kind="gift"
              context={aiContext}
              template={giftTemplate}
              notesHelp="A line or two about what contributions would help with — meals, travel, everyday costs. Or leave it blank for a gentle standard note."
              notesPlaceholder="e.g. Helping cover groceries and the kids’ activities while things settle"
              maxLength={2000}
              minHeightClass="min-h-[5rem]"
            />
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div>
              <label className="field-label">Venmo</label>
              <input className="field" value={payVenmo} onChange={(e) => setPayVenmo(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label className="field-label">Cash App</label>
              <input className="field" value={payCashapp} onChange={(e) => setPayCashapp(e.target.value)} maxLength={120} />
            </div>
            <div>
              <label className="field-label">Zelle</label>
              <input className="field" value={payZelle} onChange={(e) => setPayZelle(e.target.value)} maxLength={120} />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line/60 pt-8">
          <p className="eyebrow">Support &amp; meals — optional</p>
          <p className="mt-1 text-sm text-ink-faint">
            Adds a “Support for …” section with a map of where to bring meals and
            help. Leave the address blank to hide it.
          </p>
          <label className="mt-4 flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={showSupport} onChange={(e) => setShowSupport(e.target.checked)} className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
            Show this section
          </label>
          {showSupport && (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="field-label">Support is for</label>
                <input className="field" value={supportName} onChange={(e) => setSupportName(e.target.value)} maxLength={120} placeholder="e.g. Natalia, or the Rossi family" />
              </div>
              <div>
                <label className="field-label">Address for the map</label>
                <input className="field" value={supportAddress} onChange={(e) => setSupportAddress(e.target.value)} maxLength={300} placeholder="Street, city — or just a city" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">A note — optional</label>
                <input className="field" value={supportNote} onChange={(e) => setSupportNote(e.target.value)} maxLength={500} placeholder="e.g. No nuts, please — and the porch is the easiest drop-off." />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-5">
          <button type="submit" disabled={saving} className="btn disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm text-bronze">Saved 💛</span>}
          {saveErr && <span className="text-sm text-bronze">{saveErr}</span>}
        </div>
      </form>

      <GiftManager token={family.edit_token} initialGifts={gifts} />

      <EventManager token={family.edit_token} initialEvents={events} />

      {/* Sign-ups */}
      <section className="mt-14 border-t border-line/60 pt-10">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Who’s signed up</p>
          <p className="text-xs text-ink-faint">
            {subscriberCount} following updates
          </p>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">No sign-ups yet.</p>
        ) : (
          <ul className="mt-4">
            {bookings.map((b, i) => (
              <li key={i} className="grid grid-cols-[6rem_1fr_auto] items-baseline gap-3 border-b border-line/60 py-2.5 text-sm">
                <span className="font-medium text-bronze">{pretty(b.event_date)}</span>
                <span className="text-ink-soft">{KIND_SHORT[b.kind] || b.kind}</span>
                <span className="text-right text-ink">{b.private ? "Someone" : b.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Memories & stories (private to the family) */}
      <section className="mt-14 border-t border-line/60 pt-10">
        <p className="eyebrow">Memories &amp; stories</p>
        <p className="mt-1 text-sm text-ink-faint">
          Private — shared just for your family.
        </p>
        {memories.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">Nothing shared yet.</p>
        ) : (
          <ul className="mt-5 space-y-8">
            {memories.map((m) => (
              <li key={m.id} className="border-b border-line/60 pb-8 last:border-0">
                {m.author_name && (
                  <p className="font-serif text-lg font-light text-ink">
                    {m.author_name}
                  </p>
                )}
                {m.story && (
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-soft">
                    {m.story}
                  </p>
                )}
                {m.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {m.photos.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="h-32 w-full rounded-sm object-cover"
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
