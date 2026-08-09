import { adminPasswordIsSet, isAdmin } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured, type Slot } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { deleteSlot, logout, unclaimSlot } from "./actions";
import { attachSignedUrls, listMemories } from "@/lib/memories";
import LoginForm from "@/components/admin/LoginForm";
import SettingsForm from "@/components/admin/SettingsForm";
import AddSlotForm from "@/components/admin/AddSlotForm";
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
