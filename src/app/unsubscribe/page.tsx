import { unsubscribeByToken } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim();
  const ok = token ? await unsubscribeByToken(token) : false;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-4">Natalia &amp; the kids</p>
      {ok ? (
        <>
          <h1 className="font-serif text-3xl font-light text-ink">
            You&apos;ve been unsubscribed
          </h1>
          <p className="mt-4 max-w-measure leading-relaxed text-ink-soft">
            You won&apos;t receive any more update emails. Thank you for the love
            you&apos;ve shown the family — you&apos;re always welcome back.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif text-3xl font-light text-ink">
            Link expired or already used
          </h1>
          <p className="mt-4 max-w-measure leading-relaxed text-ink-soft">
            This unsubscribe link didn&apos;t work — you may already be
            unsubscribed. If you keep getting emails, reply to one and we&apos;ll
            take you off the list.
          </p>
        </>
      )}
      <a href="/" className="btn-link mt-8">
        ← Back to the page
      </a>
    </main>
  );
}
