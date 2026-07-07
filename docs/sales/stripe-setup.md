# Connecting Stripe to the pricing buttons

The pricing buttons on the homepage read their checkout URLs from environment
variables, so **you never need a code change to go live** — you just paste a URL
into Vercel.

| Plan     | Env variable                      | Button when set                | Button when blank |
|----------|-----------------------------------|--------------------------------|-------------------|
| Starter  | `NEXT_PUBLIC_STRIPE_STARTER_URL`  | → Stripe checkout (14-day trial) | → `/demo`         |
| Practice | `NEXT_PUBLIC_STRIPE_PRACTICE_URL` | → Stripe checkout (14-day trial) | → `/demo`         |
| Group    | `NEXT_PUBLIC_CONTACT_EMAIL`       | → mailto:                       | → `/demo`         |

## What I'll create in your **live** Stripe account (once connected)

List prices on the site are **£79** (Starter) and **£179** (Practice). For the
launch we run a **founding-practice offer** — the first 10 clinics get 12 months
at a lower rate — so the live Payment Links charge the founding price:

- **Starter** — £49 / month, 14-day free trial, billed in GBP (founding; list £79).
- **Practice** — £119 / month, 14-day free trial, billed in GBP (founding; list £179).
- **Group** — no link; the "Contact us" button emails you.

Each is a subscription Payment Link with a card-required trial, and its
after-payment page redirects back to the site. Once the first 10 founding slots
are gone, create fresh links at the £79 / £179 list prices and swap the two env
vars — again, no code change.

## Steps

1. **Connect a live Stripe account.** The account currently connected here is a
   sandbox ("nova05 sandbox"), which only accepts test cards. Reconnect Stripe in
   live mode (or create/activate a live account) so I can create real links.
2. **I create the two live Payment Links** and verify each one loads and shows the
   £-price + 14-day trial.
3. **You add three env vars in Vercel** (Project → Settings → Environment
   Variables), Production scope:
   - `NEXT_PUBLIC_STRIPE_STARTER_URL` = the Starter link
   - `NEXT_PUBLIC_STRIPE_PRACTICE_URL` = the Practice link
   - `NEXT_PUBLIC_CONTACT_EMAIL` = your business email (for the Group button)
4. **Redeploy** (or I merge a trivial change to trigger it). The buttons now go
   straight to live checkout.
5. Only **after** the buttons are verified live do we start the outreach.

## Notes

- **VAT:** if you're VAT-registered, enable Stripe Tax on the products so VAT is
  added at checkout. The pricing note says prices exclude VAT.
- **Trial with card:** customers enter a card now and are auto-charged after 14
  days unless they cancel — standard SaaS. Turn on Stripe's trial-ending emails.
- The buttons never dead-end: before the URLs are set they open the live demo.
