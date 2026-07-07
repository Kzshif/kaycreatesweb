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

## Sandbox flow — verified ✅

The full flow was built and confirmed in the sandbox: two subscription Payment
Links (£49 / £119, GBP, monthly, 14-day card-required trial, redirect to
`/demo`), and the pricing buttons were shown to embed those URLs when the env
vars are set. Going live is now just recreating the two links in live mode.

## Create the two LIVE Payment Links (in your Stripe dashboard)

Do this **twice** — once for Starter, once for Practice.

1. Top-right of the Stripe dashboard, switch from Test/sandbox to **Live mode**.
2. **Product catalog → Add product.**
   - Starter: name `nova05 Starter`, price **£49.00**, **Recurring · Monthly**, currency **GBP**. Save.
   - Practice: name `nova05 Practice`, price **£119.00**, **Recurring · Monthly**, GBP. Save.
3. **Payment links → + New.** Pick the product/price you just made, quantity 1.
4. Open **More options**:
   - **Subscriptions → Free trial:** set **14 days** (this makes the card required).
   - **After payment → Redirect customers to your site:**
     `https://kaycreatesweb-taupe.vercel.app/demo`
5. **Create link** and copy the `https://buy.stripe.com/...` URL.

## Then wire them up

6. **Vercel → Project → Settings → Environment Variables** (Production scope):
   - `NEXT_PUBLIC_STRIPE_STARTER_URL` = the Starter link
   - `NEXT_PUBLIC_STRIPE_PRACTICE_URL` = the Practice link
   - `NEXT_PUBLIC_CONTACT_EMAIL` = your business email (for the Group button)
7. Tell me — I merge to `main`, which redeploys with the buttons live.
8. I verify the live buttons carry the live links, then we start outreach.

## Notes

- **VAT:** if you're VAT-registered, enable Stripe Tax on the products so VAT is
  added at checkout. The pricing note says prices exclude VAT.
- **Trial with card:** customers enter a card now and are auto-charged after 14
  days unless they cancel — standard SaaS. Turn on Stripe's trial-ending emails.
- The buttons never dead-end: before the URLs are set they open the live demo.
