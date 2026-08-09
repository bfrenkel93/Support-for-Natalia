import "server-only";
import { getSupabase, type Gift } from "./supabase";

/**
 * "Give a Gift" — ideas like a private-chef week, a massage, or a manicure that
 * people can chip in toward. Contributions happen off-site via a payment link
 * (Venmo / PayPal / GoFundMe / etc.); pledges here are just coordination so the
 * group can see what's been covered.
 */
export async function getGifts(): Promise<Gift[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("gifts")
    .select("*, pledges:gift_pledges(*)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.error("[getGifts]", error);
    return [];
  }

  return (data as Gift[]).map((g) => ({
    ...g,
    pledges: (g.pledges || []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }));
}
