# MoveProof starter

Room-by-room move-in and move-out photos, timestamped, fingerprinted and locked, in one shareable PDF.

| Part | Tool | Where in this project |
| --- | --- | --- |
| Front end | Next.js 15 + Tailwind | `app/`, `components/` |
| Middleware | Next.js middleware | `middleware.ts`, `lib/supabase/middleware.ts` |
| Back end | Next.js API routes on Vercel | `app/api/` |
| Database, login, files | Supabase | `supabase/migrations/` |
| Payments | Stripe | `app/api/checkout`, `app/api/stripe/webhook`, `app/api/billing-portal` |
| PDF reports | pdf-lib | `app/api/reports/route.ts` |

This code was written carefully but not run. Expect a few small fixes on the first build; paste errors into Claude.

---

## 1. Open it in VS Code
1. Unzip, then File > Open Folder > `moveproof`.
2. Terminal (Ctrl + `):
   ```bash
   npm install
   ```
   If `npm audit` warns about PostCSS inside Next.js, it's the same build-time-only warning as before; don't use `--force`.

## 2. Supabase (database, login, file storage)
1. supabase.com > New project (save the database password).
2. **SQL Editor** > New query > paste all of `supabase/migrations/20261008000000_init.sql` > **Run**. You should see the tables under Table Editor and two buckets, `evidence` and `reports`, under Storage.
3. **Authentication > Providers:** Email is on by default. Google and Apple need OAuth keys from their developer sites; Supabase's docs walk through each. You can launch with email only and add them later.
4. **Authentication > URL Configuration:** Site URL `http://localhost:3000` for now; add redirect URLs `http://localhost:3000/**` and later `https://YOUR-DOMAIN/**`.
5. **Project Settings > API:** copy the Project URL, the anon/publishable key, and the service_role/secret key.

## 3. Stripe (payments), in test mode
1. stripe.com > create an account, keep **Test mode** on.
2. **Product catalog > Add product:**
   - "Home Pass", one-time, $9.00 → copy its **price ID** (`price_...`).
   - "Landlord plan", recurring monthly, $15.00 → copy its price ID.
3. **Developers > API keys:** copy the secret key (`sk_test_...`).
4. **Settings > Billing > Customer portal:** turn it on and allow cancellations.
5. Webhook for local testing: install the Stripe CLI, then in a second terminal:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   It prints a `whsec_...` secret: that's your `STRIPE_WEBHOOK_SECRET` for local use.

## 4. Environment file
Copy `.env.example` to `.env.local` (same folder as `package.json`) and fill in every value. Then:
```bash
npm run dev
```
Open http://localhost:3000.

## 5. Test the whole flow
1. Sign in with your email link.
2. Add a home, start a move-in walkthrough, take photos on your phone (see tip below), lock it.
3. On the report page, buy the Home Pass with test card `4242 4242 4242 4242`, any future date, any CVC.
4. Create the PDF, open it, then visit `/verify/YOUR-CODE` and drop the PDF in. It should say unchanged.

**Testing on your phone:** your phone can't reach `localhost`. Either deploy to Vercel first (step 6) or run `npm run dev -- -H 0.0.0.0` and open the "Network" address Next.js prints, with your phone on the same Wi-Fi. Camera upload works best on the deployed https site.

## 6. GitHub and Vercel
```bash
git init
git add .
git commit -m "MoveProof starter"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/moveproof.git
git push -u origin main
```
Create the empty **private** repo on github.com first. Then vercel.com > Add New Project > import it > add **every** variable from `.env.local` (with `NEXT_PUBLIC_SITE_URL` set to your Vercel address) > Deploy.

In Stripe > Developers > Webhooks > Add endpoint: `https://YOUR-SITE/api/stripe/webhook`, events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Put its signing secret in Vercel as `STRIPE_WEBHOOK_SECRET` and redeploy.

## 7. Go live
- Buy your domain, add it in Vercel, update `NEXT_PUBLIC_SITE_URL` and Supabase URL settings.
- Upgrade Vercel to Pro (Hobby is for non-commercial use) and Supabase to Pro (free projects pause when idle).
- Stripe: switch to live mode, recreate the two products, new live keys and webhook secret.
- Have an attorney review `app/legal/page.tsx` and the method statement in `app/api/reports/route.ts`.

## Not built yet
- Landlord plan unit limit (10 homes) isn't enforced.
- Sharing a walkthrough with the other party to sign or acknowledge.
- Very large walkthroughs (150+ photos) may hit the 60-second report limit; split them into two walkthroughs for now.
