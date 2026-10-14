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

To grant the first administrator, run this in the Supabase SQL editor after replacing the email:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'ADMIN_EMAIL'
on conflict (user_id, role) do nothing;
```

Providers register at `/advertiser`, create a draft, and submit a transfer reference for manual funding verification. An administrator reviews the provider, verifies payment against the external account, and approves the campaign at `/admin/campaigns`. Only approved campaigns with the full budget marked as paid are visible at `/adsincome`. Earner submissions remain pending until the provider approves them; the review RPC updates the wallet and transaction atomically.

Funding is currently reconciled manually; no payment gateway is configured. The marketplace is for TaskMint-owned sponsored activities, not incentivized impressions or clicks on Google AdSense, Adsterra, or other third-party ad-network units. Do not embed or reward ad-network clicks/views.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
