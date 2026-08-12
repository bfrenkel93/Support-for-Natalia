"use client";

import { useState, type FormEvent } from "react";

type FamilyLite = {
  slug: string;
  display_name: string;
  honoring: string | null;
  town: string | null;
  has_kids: boolean;
  is_public: boolean;
  edit_token: string;
  hero_image_url: string | null;
  intro_message: string;
  memorial_title: string;
  memorial_intro: string;
  memorial_when: string;
  memorial_where: string;
  memorial_note: string;
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

export default function ManageFamily({
  family,
  bookings,
  memories,
  subscriberCount,
  gatheringTotal,
  gatheringParties,
}: {
  family: FamilyLite;
  bookings: BookingLite[];
  memories: MemoryLite[];
  subscriberCount: number;
  gatheringTotal: number;
  gatheringParties: number;
}) {
  const [displayName, setDisplayName] = useState(family.display_name);
  const [honoring, setHonoring] = useState(family.honoring || "");
  const [town, setTown] = useState(family.town || "");
  const [hasKids, setHasKids] = useState(family.has_kids);
  const [isPublic, setIsPublic] = useState(family.is_public);
  const [introMessage, setIntroMessage] = useState(family.intro_message);

  const [memTitle, setMemTitle] = useState(family.memorial_title);
  const [memIntro, setMemIntro] = useState(family.memorial_intro);
  const [memWhen, setMemWhen] = useState(family.memorial_when);
  const [memWhere, setMemWhere] = useState(family.memorial_where);
  const [memNote, setMemNote] = useState(family.memorial_note);

  const [heroUrl, setHeroUrl] = useState<string | null>(family.hero_image_url);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const pageUrl = `/${family.slug}`;

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
          town,
          hasKids,
          isPublic,
          introMessage,
          memorialTitle: memTitle,
          memorialIntro: memIntro,
          memorialWhen: memWhen,
          memorialWhere: memWhere,
          memorialNote: memNote,
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
            <label className="field-label">Page name</label>
            <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="field-label">Who you’re honoring</label>
            <input className="field" value={honoring} onChange={(e) => setHonoring(e.target.value)} maxLength={200} placeholder="e.g. Joe" />
          </div>
          <div>
            <label className="field-label">Town or city</label>
            <input className="field" value={town} onChange={(e) => setTown(e.target.value)} maxLength={200} placeholder="e.g. Newton, MA" />
          </div>
        </div>

        <div className="mt-6">
          <label className="field-label">Your opening message</label>
          <textarea
            className="field min-h-[9rem]"
            value={introMessage}
            onChange={(e) => setIntroMessage(e.target.value)}
            maxLength={6000}
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
            <label className="field-label">Invitation message</label>
            <textarea className="field min-h-[6rem]" value={memIntro} onChange={(e) => setMemIntro(e.target.value)} maxLength={3000} />
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

        <div className="mt-8 flex items-center gap-5">
          <button type="submit" disabled={saving} className="btn disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm text-bronze">Saved 💛</span>}
          {saveErr && <span className="text-sm text-bronze">{saveErr}</span>}
        </div>
      </form>

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
