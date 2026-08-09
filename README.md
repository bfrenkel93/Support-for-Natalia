# Support for Natalia 💛

A warm, private, one-page site to help friends and family coordinate care for
Natalia and her kids — a monthly weekend visit for the children, and an ongoing
rotation of meals and visits for Natalia. People claim open slots (no login), so
nothing gets double-booked, and you get an email whenever someone signs up.

- **Framework:** Next.js 14 (App Router) + Tailwind CSS
- **Data:** Supabase (free tier) — atomic claims prevent double-booking
- **Email:** Resend (optional) — notifies you on every sign-up
- **Hosting:** Vercel (free tier)
- Private by design: `noindex`, `nofollow`, and a `Disallow: /` robots rule.

---

## What's on the page

1. **Hero** — family photo placeholder + your heartfelt intro message.
2. **Visits for the Kids** — open weekends with a “Sign up” button each. Once
   claimed, the weekend shows the person's name (or just “Claimed” if they chose
   privacy). Every event has **Add to Google Calendar** and **Apple / iCloud**
   (`.ics`) links.
3. **Support for Natalia** — an open list of days for meals/visits, each with an
   optional note (“bringing dinner”, “just stopping by”) and its own calendar
   links. Includes a **meal-help block**: a prominent allergy note (Alexander is
   allergic to cashews & pistachios), an **Uber Eats** link, and a **map of
   restaurants near the family's home** (address is editable in the admin).
4. **Tell the Kids a Story About Their Dad** — a private place to submit written
   memories and photos for the kids. **Nothing here is ever shown on the public
   page.** Photos go to a **private** Supabase Storage bucket and are only ever
   viewable inside the dashboard through short-lived, server-generated signed
   URLs. EXIF/location metadata is stripped from JPEGs; uploads are validated
   server-side (photos only — JPEG/PNG/WEBP/GIF/HEIC, up to 10 files, 25 MB
   each).
5. **Other ways to help** — an editable text block.
6. **Admin dashboard** at **`/admin`** — password protected. See every sign-up,
   read all private memories and view/download the photos, export the written
   stories, add/remove slots, reopen a slot, and edit all the page text without
   touching code. (Natalia can use this same dashboard — one shared password —
   so she can both manage dates and read the memories.)

All the wording and the list of dates are editable from `/admin`, so you can
drop in your real intro text and dates yourself.

---

## Setup (about 10 minutes)

### 1. Create the Supabase project & tables
1. Go to [supabase.com](https://supabase.com) → **New project** (free tier).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase-schema.sql`](./supabase-schema.sql), and **Run**. This creates the
   `slots` and `settings` tables, seeds default text, and adds a few example
   slots so the page looks alive right away.
3. Go to **Project Settings → API** and copy:
   - the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - the **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`
     *(this is a secret — it's only ever used server-side and is never sent to
     the browser.)*

### 2. (Optional) Email notifications with Resend
1. Sign up at [resend.com](https://resend.com) and create an **API key** →
   `RESEND_API_KEY`.
2. Set `NOTIFY_EMAIL` to the address that should receive sign-up alerts.
3. `RESEND_FROM` can stay as `onboarding@resend.dev` for testing. To send from
   your own address, verify a domain in Resend and update this value.

If you skip this step, sign-ups still work — you just won't get emails.

### 3. Set your admin password
Choose any password and set it as `ADMIN_PASSWORD`. You'll type it once at
`/admin` to reach the dashboard.

### 4. Run it locally
```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). The dashboard is at
[http://localhost:3000/admin](http://localhost:3000/admin).

---

## Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import the
   repo.
3. Under **Environment Variables**, add the same keys from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `RESEND_API_KEY` *(optional)*
   - `NOTIFY_EMAIL` *(optional)*
   - `RESEND_FROM` *(optional)*
4. **Deploy.** Vercel gives you a URL — share it only with people close to the
   family. (It's set to `noindex`, so search engines won't list it.)

To change env vars later: Vercel → Project → **Settings → Environment
Variables**, then redeploy.

---

## Using the admin dashboard

Visit `/admin`, enter your password, and you can:

- **Add a slot** — pick a section (kids / Natalia), a date and/or a label
  (e.g. “Weekend of Sept 12–13”), an optional description, and a sort order.
- **Delete a slot** or **Reopen** one that was claimed (e.g. if plans change).
- **Edit page text** — the intro message, both section intros, the “other ways
  to help” block, the footer, and the contact email. Saves go live instantly.

The example slots from the schema are safe to delete once you've added your real
dates.

---

## How double-booking is prevented

When someone claims a slot, the server runs a single conditional update:
“mark this slot claimed **only if it's still unclaimed**.” Postgres guarantees
only one of two simultaneous requests can win — the other is told the slot was
just taken and asked to pick another. No overlap is possible, even if two people
tap “Sign up” at the same instant.

## Privacy & security notes

- No visitor login or tracking; visitors give only a name (email optional).
- The Supabase **service_role** key and `ADMIN_PASSWORD` live only in server
  environment variables — never shipped to the browser.
- Row Level Security is on with no public policies, so the data can't be read or
  written with the public key.
- `noindex` meta tag, `X-Robots-Tag` header, and a `Disallow: /` robots rule
  keep the page out of search engines.

---

## Editing the look

- Colors live in [`tailwind.config.ts`](./tailwind.config.ts)
  (`sage`, `softblue`, `cream`, `clay`).
- Fonts are Fraunces (headings) + Nunito Sans (body), set in
  [`src/app/layout.tsx`](./src/app/layout.tsx).
- Replace the photo placeholder in
  [`src/components/Hero.tsx`](./src/components/Hero.tsx) with a real family
  photo (drop an image in `/public` and use Next's `<Image>`).
