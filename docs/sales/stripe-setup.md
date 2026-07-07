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

Two subscription **Payment Links**, each with a card-required free trial:

- **Starter** — £29 / month, 14-day free trial, billed in GBP.
- **Practice** — £79 / month, 14-day free trial, billed in GBP.
- **Group** — no link; the "Contact us" button emails you.

Each link's after-payment page redirects back to the site.

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
