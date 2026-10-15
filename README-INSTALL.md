# TaskMint full-stack wallet/withdrawal module

This is a drop-in implementation for the existing Next.js 16 + Supabase TaskMint app. It adds the missing user withdrawal page and finance/admin review workflow, keeping the existing dark green/lime design and auth helpers.

## Included files

- `app/wallet/page.tsx` — signed-in user's wallet, withdrawal form, and request history.
- `app/wallet/actions.ts` — server action with form validation and Supabase RPC call.
- `app/admin/withdrawals/page.tsx` — finance/admin withdrawal queue and review UI.
- `app/admin/withdrawals/actions.ts` — server action for processing, confirming paid, or rejecting a request.
- `supabase/migrations/20261016_wallet_withdrawals.sql` — DB columns and atomic, authorization-checked RPC functions.
- `apply-taskmint-nav.py` — adds links from the existing dashboard and campaign admin screen without overwriting either file.

## Install

1. Extract this folder into the root of your existing `taskmint-app` working copy so the `app/` and `supabase/` directories merge with your existing ones. Do not replace the current project with this module folder.
2. Run the navigation patch script from your repository root:

   ```bash
   python apply-taskmint-nav.py
   ```

   It is idempotent and validates both insertion points before changing either file. It stops if the expected source lines have changed. Review the modified files with `git diff`.

3. In Supabase Dashboard → SQL Editor, run `supabase/migrations/20261016_wallet_withdrawals.sql` after your existing schema and migrations. Do not rerun `schema.sql` on a live database.
4. Run local checks:

   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. Deploy to Vercel after reviewing the changes and checking your production Supabase project.

## Security and money handling

- A request locks the wallet row and checks the current balance server-side before creating the request and reserving the amount.
- Finance/admin permissions are rechecked inside the database review function. A row lock and terminal-status check prevent repeated reviews from refunding a rejected request more than once.
- Rejection restores the reserved amount. Marking paid requires a payout transaction reference. All actions create audit log entries.
- The existing project treats `balance_minor`, `reward_minor`, and related columns as whole BDT values in forms and displays, despite the `*_minor` column names. The migration preserves that convention to avoid corrupting existing wallet values. A future currency-model migration should convert all balances and rewards together, not just withdrawals.
- This module does not execute a real payment. Finance staff still make payouts externally and verify the transfer reference before selecting **Confirm paid**.

## Routes

- `/wallet` — authenticated user wallet and withdrawal requests.
- `/admin/withdrawals` — finance/admin queue. Roles are checked at the page and again in the database RPC.

The project's existing `proxy.ts` already matches `/wallet/:path*` and `/admin/:path*`, so no proxy change is required.

## What this does not claim

This module has not been applied to your GitHub repository or deployed to production. The current connected GitHub integration returned `403 Resource not accessible by integration` for writes, and the container could not clone GitHub. Apply the files to your working copy and run the checks above before deployment.
