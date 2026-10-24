# Doorstamp

California AB 2801 move-in and move-out photo records. Room by room, timestamped, fingerprinted, locked, and sent as a link the other side opens in any browser. Renters pay once per move; landlords are free.

| Part | Tool | Where |
| --- | --- | --- |
| Front end | Next.js 15 + Tailwind | `app/`, `components/` |
| Middleware | Next.js middleware (sign-in check) | `middleware.ts`, `lib/supabase/middleware.ts` |
| Back end | Next.js API routes on Vercel | `app/api/` |
| Database, login, files | Supabase | `supabase/migrations/` |
| Payments | Stripe, one-time Move Pass | `app/api/checkout`, `app/api/stripe/webhook` |
| PDF reports | pdf-lib | `app/api/reports/route.ts` |
| Share links | Public page + acknowledge | `app/api/shares`, `app/r/[token]` |

## What changed in this update (from MoveProof)
1. **California first.** Landing page, record titles, PDF cover and footer say "California AB 2801". Landlords get a third walkthrough, *After-repair*, for AB 2801's third photo step. The AB 2801 summary lives in one file: `lib/california.ts`.
2. **No app to download.** New share links: the renter (or landlord) creates a link, the other side opens it in any browser with no account and can acknowledge they received it. Added a web-app manifest and icons so phones can "Add to Home Screen".
3. **Price per move.** The $15/month Landlord plan is gone. Renters buy one **Move Pass** ($9 once per address, move-in + move-out). Landlords are free. Share pages invite the other side to make their own record.
4. Renamed MoveProof → Doorstamp everywhere. Price and name live in `lib/brand.ts`.

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in every value.
3. `npm run dev`, then open http://localhost:3000.

## Supabase
Run both files in **SQL Editor** (New query → paste → Run), in this order:
1. `supabase/migrations/20261008000000_init.sql` (skip if you already ran it)
2. `supabase/migrations/20261018000000_doorstamp.sql`

Authentication → URL Configuration: Site URL and redirect URLs for `http://localhost:3000/**` and your live domain.

## Stripe (test mode first)
- One product: **Move Pass**, one-time, $9. Its price ID goes in `STRIPE_PRICE_MOVE_PASS`.
- Webhook endpoint `https://YOUR-SITE/api/stripe/webhook`, event **checkout.session.completed** only.
- Settings → Customer emails → turn on receipts for successful payments.
- Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Test card `4242 4242 4242 4242`.

## Test the whole flow
1. Sign in, add a **renter** home in CA, start a move-in walkthrough, take photos, lock it.
2. Buy the Move Pass with the test card. Create a share link and open it in a private window: you should see the photos and the Acknowledge box, without signing in.
3. Acknowledge with a name. Back on the report page, the link shows "Acknowledged by …".
4. Create the PDF: the cover says "California AB 2801 Move-in Photo Record". Check it at `/verify/CODE`.
5. Add a **landlord** home: all three walkthroughs, PDF and links are free, no payment screen.

## Go live
- Domain getdoorstamp.com in Vercel; set `NEXT_PUBLIC_SITE_URL=https://getdoorstamp.com` and add it to Supabase URL settings.
- Vercel Pro and Supabase Pro before charging real money.
- Stripe live mode: recreate the Move Pass product, new live keys, new webhook secret.
- Attorney review: `app/legal/page.tsx`, `lib/california.ts`, the method text in `app/api/reports/route.ts`.

## Known limits
- Anyone can pick "Landlord" when adding a home. The role can't be changed later and is printed on every record and share page, which limits the benefit of picking the wrong one.
- Very large walkthroughs (150+ photos) may hit the 60-second PDF limit; split them for now.
- Ad copy for the demand test: `docs/california-ads.md`.
