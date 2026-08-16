import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import CancelRsvp from "@/components/CancelRsvp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cancel your RSVP",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CancelRsvpPage({
  searchParams,
}: {
  searchParams: { token?: string; t?: string };
}) {
  const token = (searchParams.token || "").trim();
  const type = (searchParams.t || "g").trim() === "e" ? "e" : "g";

  let name = "";
  let found = false;
  const sb = getSupabase();
  if (sb && token) {
    const table = type === "e" ? "event_rsvps" : "gathering_rsvps";
    const { data } = await sb
      .from(table)
      .select("name")
      .eq("cancel_token", token)
      .maybeSingle();
    if (data) {
      found = true;
      name = (data as { name?: string }).name || "";
    }
  }

  if (!token || !found) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-light text-ink">
          This RSVP is already canceled
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Either it’s already been canceled, or this link is out of date. If you
          think that’s a mistake, just RSVP again — you’re always welcome.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-light text-ink">Cancel your RSVP?</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        No need to explain — plans change. Confirm below and we’ll let them know
        you can’t make it.
      </p>
      <div className="mt-2 flex justify-center">
        <CancelRsvp token={token} type={type} name={name} />
      </div>
    </main>
  );
}
