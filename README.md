This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Campaign Marketplace Setup

Apply `supabase/schema.sql` to a new Supabase project, then apply `supabase/migrations/20261014_campaign_marketplace.sql`. The migration adds server-timed campaign sessions, reviewable submissions, advertiser funding requests, administrator approval functions, and wallet write protections. The marketplace will not load campaign data until the migration is applied.

If an existing project reports `42P17 infinite recursion detected in policy for relation "user_roles"`, run `supabase/migrations/20261015_fix_user_roles_recursion.sql` in the Supabase SQL Editor. This focused repair replaces self-querying role policies with a `SECURITY DEFINER` helper; it is safe to rerun and does not require rerunning `schema.sql`.

After the role repair, apply `supabase/migrations/20261016_financial_workflows.sql`, then `supabase/migrations/20261016_wallet_withdrawals.sql`. These remove direct wallet/subscription writes, add audited finance review RPCs, and reserve/release withdrawal balances transactionally. Do not rerun the base schema on an existing database.

To grant the first administrator, run this in the Supabase SQL editor after replacing the email:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'ADMIN_EMAIL'
on conflict (user_id, role) do nothing;
```

Providers register at `/advertiser`, create a draft, and submit a transfer reference for manual funding verification. An administrator reviews the provider, verifies payment against the external account, and approves the campaign at `/admin/campaigns`. Only approved campaigns with the full budget marked as paid are visible at `/adsincome`. Earner submissions remain pending until the provider approves them; the review RPC updates the wallet and transaction atomically.

Funding is currently reconciled manually; no payment gateway is configured. The marketplace is for TaskMint-owned sponsored activities, not incentivized impressions or clicks on Google AdSense, Adsterra, or other third-party ad-network units. Do not embed or reward ad-network clicks/views.

Withdrawals are also manual: TaskMint reserves a request from the available wallet balance, and finance/admin staff must send the money externally before recording it as paid. There is no payout provider integration. Existing `*_minor` wallet columns are currently interpreted by the app as whole BDT units; these migrations preserve historical values and do not rescale them. Audit/reconcile existing balances before introducing decimal minor-unit conversions. Paid subscriptions remain disabled until checkout and payment verification are configured.

## Adsterra Smartlink Setup

The optional Adsterra button is a voluntary external Smartlink and never awards TaskMint rewards. Adsterra's [publisher terms](https://adsterra.com/publishers-terms-managed/) prohibit using incentives to increase impression, click, or action volumes (section 6(d)(iv)). Its [Smartlink documentation](https://adsterra.com/smartlink-ads/) says to copy the active URL from the Publisher account. No completion callback or verified conversion postback is configured here, so ad views, clicks, conversions, and Smartlink visits cannot complete or reward a TaskMint task.

After Adsterra approves the TaskMint serving domain and activates the Smartlink, set these server-side values in `.env.local`:

```env
ADSTERRA_SMARTLINK_URL=
ADSTERRA_PUBLISHER_SITE_APPROVED=false
```

The URL must be the exact HTTPS Smartlink copied from the account. The approval flag should remain `false` until Adsterra approves the site's domain. Restart the dev server after changing environment values. Visit `/adsincome` while signed in and use “View Sponsored Offer”; no wallet or campaign state changes should occur.

Banner, Native, Social Bar, and other display units are intentionally not loaded from their IDs alone. Adsterra supplies the exact publisher tag in its dashboard after site approval; tags must not be reconstructed or modified. Popunder is disabled. Add official tags only after confirming the exact unit code and the approved domain, and keep those placements separate from any TaskMint campaign actions.

Run `npm test` for Adsterra configuration and reward-eligibility checks. Callback-signature and duplicate-callback tests are not applicable because this integration creates no Adsterra callback endpoint and grants no Adsterra-linked reward.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
