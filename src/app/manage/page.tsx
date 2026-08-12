import type { Metadata } from "next";
import { getFamilyByEditToken } from "@/lib/families";
import { getFamilyBookings } from "@/lib/bookings";
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

  return (
    <ManageFamily
      family={{
        slug: family.slug,
        display_name: family.display_name,
        honoring: family.honoring,
        town: family.town,
        has_kids: family.has_kids,
        is_public: family.is_public,
        edit_token: family.edit_token,
        hero_image_url: family.content?.hero_image_url ?? null,
        intro_message: family.content?.intro_message ?? "",
      }}
      bookings={bookings.map((b) => ({
        event_date: b.event_date,
        kind: b.kind,
        name: b.name,
        private: b.private,
      }))}
    />
  );
}
