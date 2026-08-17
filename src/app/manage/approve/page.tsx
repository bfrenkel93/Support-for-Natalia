import type { Metadata } from "next";
import { getFamilyByEditToken } from "@/lib/families";
import { getSupabase, type Booking } from "@/lib/supabase";
import { FAMILY_KIND_LABEL } from "@/lib/bookings";
import ApproveRequest from "@/components/ApproveRequest";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approve a request",
  robots: { index: false, follow: false, nocache: true },
};

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function ApprovePage({
  searchParams,
}: {
  searchParams: { token?: string; id?: string; do?: string };
}) {
  const token = (searchParams.token || "").trim();
  const id = (searchParams.id || "").trim();
  const preselect =
    searchParams.do === "decline" ? "decline" : searchParams.do === "confirm" ? "confirm" : null;

  const family = token ? await getFamilyByEditToken(token) : null;
  const sb = getSupabase();

  let booking: Booking | null = null;
  if (family && sb && id) {
    const { data } = await sb
      .from("bookings")
      .select("*")
      .eq("id", id)
      .eq("family_id", family.id)
      .maybeSingle();
    booking = (data as Booking) || null;
  }

  if (!family || !booking) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-light text-ink">
          This request can’t be found
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          It may already have been handled, or the link is out of date. You can
          open your full dashboard from the “manage your page” link in your email.
        </p>
      </main>
    );
  }

  if (booking.status !== "requested") {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-light text-ink">
          Already {booking.status === "confirmed" ? "approved" : "declined"}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          This request was already {booking.status === "confirmed" ? "approved" : "declined"}.
          Nothing more to do.
        </p>
      </main>
    );
  }

  const kindLabel = FAMILY_KIND_LABEL[booking.kind] || "a request";

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-bronze">
        A request to approve
      </p>
      <h1 className="mt-4 font-serif text-2xl font-light leading-snug text-ink">
        {booking.name} would like to help
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        {kindLabel} · {prettyDate(booking.event_date)}
        {booking.email ? (
          <>
            <br />
            {booking.email}
          </>
        ) : null}
      </p>
      {booking.note ? (
        <p className="mt-3 italic leading-relaxed text-ink-soft">“{booking.note}”</p>
      ) : null}

      <ApproveRequest token={token} id={id} preselect={preselect} />

      <p className="mt-6 text-xs text-ink-faint">
        Nothing happens to their sign-up until you choose. If you’d rather not
        decide right now, you can just close this — it’ll keep waiting.
      </p>
    </main>
  );
}
