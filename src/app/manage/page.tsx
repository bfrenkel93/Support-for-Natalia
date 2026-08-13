import type { Metadata } from "next";
import { getFamilyByEditToken } from "@/lib/families";
import { getFamilyBookings, getAllFamilyBookings, getFamilyPendingRequests } from "@/lib/bookings";
import { getFamilyMemoriesWithUrls } from "@/lib/memories";
import { getFamilySubscriberCount } from "@/lib/subscribers";
import { getFamilyGathering } from "@/lib/gathering";
import { getFamilyGifts } from "@/lib/gifts";
import { getFamilyEvents } from "@/lib/events";
import { getFamilyRequests } from "@/lib/requests";
import ManageFamily from "@/components/ManageFamily";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage your page",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ManagePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = (searchParams.token || "").trim();
  const family = token ? await getFamilyByEditToken(token) : null;

  if (!family) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-light text-ink">
          This manage link isn’t valid
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          The link may be incomplete or out of date. Please open the private
          “manage your page” link from your email, in full.
        </p>
      </main>
    );
  }

  const bookings = await getFamilyBookings(family.id);
  const memories = await getFamilyMemoriesWithUrls(family.id);
  const subscriberCount = await getFamilySubscriberCount(family.id);
  const gathering = await getFamilyGathering(family.id);
  const gifts = await getFamilyGifts(family.id);
  const events = await getFamilyEvents(family.id);
  const requests = await getFamilyRequests(family.id);
  const pendingRequests = (await getFamilyPendingRequests(family.id)).map((b) => ({
    id: b.id,
    kind: b.kind,
    name: b.name,
    event_date: b.event_date,
    email: b.email,
    note: b.note,
  }));

  // Everyone who signed up and left an email — for the one-tap thank-you tool.
  // Use ALL bookings (past + upcoming) so people who already helped are included.
  const allBookings = await getAllFamilyBookings(family.id);
  const helperMap = new Map<string, { name: string; email: string }>();
  for (const b of allBookings) {
    const em = (b.email || "").trim();
    const key = em.toLowerCase();
    if (em && !helperMap.has(key)) helperMap.set(key, { name: b.name || "", email: em });
  }
  for (const g of gifts) {
    for (const p of g.pledges || []) {
      const em = (p.email || "").trim();
      const key = em.toLowerCase();
      if (em && !helperMap.has(key)) helperMap.set(key, { name: p.name || "", email: em });
    }
  }
  const helpers = Array.from(helperMap.values());

  return (
    <ManageFamily
      pendingRequests={pendingRequests}
      helpers={helpers}
      requests={requests.map((r) => ({
        id: r.id,
        title: r.title,
        details: r.details,
        needed_date: r.needed_date,
        claimed_by: r.claimed_by,
      }))}
      subscriberCount={subscriberCount}
      gatheringTotal={gathering.total}
      gatheringParties={gathering.parties}
      gatheringRegrets={gathering.regrets}
      gifts={gifts.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        cost: g.cost,
      }))}
      events={events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        event_date: ev.event_date,
        event_time: ev.event_time,
      }))}
      memories={memories.map((m) => ({
        id: m.id,
        author_name: m.author_name,
        story: m.story,
        created_at: m.created_at,
        photos: m.media
          .map((md) => md.viewUrl)
          .filter((u): u is string => Boolean(u)),
      }))}
      family={{
        slug: family.slug,
        display_name: family.display_name,
        honoring: family.honoring,
        town: family.town,
        has_kids: family.has_kids,
        is_public: family.is_public,
        access_code: family.content?.access_code ?? "",
        contact_email: family.contact_email ?? "",
        edit_token: family.edit_token,
        hero_image_url: family.content?.hero_image_url ?? null,
        eyebrow: family.content?.eyebrow ?? "",
        relationship: family.content?.relationship ?? "",
        intro_message: family.content?.intro_message ?? "",
        memories_public: family.content?.memories_public === true,
        memorial_title: family.content?.memorial_title ?? "",
        memorial_intro: family.content?.memorial_intro ?? "",
        memorial_when: family.content?.memorial_when ?? "",
        memorial_where: family.content?.memorial_where ?? "",
        memorial_note: family.content?.memorial_note ?? "",
        gifts_intro: family.content?.gifts_intro ?? "",
        pay_venmo: family.content?.pay_venmo ?? "",
        pay_cashapp: family.content?.pay_cashapp ?? "",
        pay_zelle: family.content?.pay_zelle ?? "",
        show_calendar: family.content?.show_calendar !== false,
        show_memorial: family.content?.show_memorial !== false,
        show_gifts: family.content?.show_gifts !== false,
        show_subscribe: family.content?.show_subscribe !== false,
        show_memories: family.content?.show_memories !== false,
        show_events: family.content?.show_events !== false,
        support_name: family.content?.support_name ?? "",
        support_address: family.content?.support_address ?? "",
        support_note: family.content?.support_note ?? "",
        show_support: family.content?.show_support !== false,
      }}
      bookings={bookings
        .filter((b) => b.status === "confirmed")
        .map((b) => ({
          event_date: b.event_date,
          kind: b.kind,
          name: b.name,
          private: b.private,
        }))}
    />
  );
}
