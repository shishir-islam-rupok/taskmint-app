-- Repair recursive RLS policies in projects where schema.sql and the marketplace
-- migration were applied before the role-helper fix.
begin;

create or replace function public.current_user_has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(p_roles)
  );
$$;

revoke all on function public.current_user_has_role(text[]) from public, anon;
grant execute on function public.current_user_has_role(text[]) to authenticated;

drop policy if exists "Admin can access all profiles" on public.profiles;
drop policy if exists "Admins manage roles" on public.user_roles;
drop policy if exists "Admins and reviewers can access review queue" on public.task_submissions;
drop policy if exists "Finance and admins can see all withdrawal requests" on public.withdrawal_requests;
drop policy if exists "Finance and admins can read all ledger tables" on public.ledger_accounts;
drop policy if exists "Finance and admins can read all ledger transactions" on public.ledger_transactions;
drop policy if exists "Finance and admins can read all ledger entries" on public.ledger_entries;
drop policy if exists "Admins can manage advertisers" on public.advertiser_profiles;
drop policy if exists "Admins can manage all campaigns" on public.campaigns;
drop policy if exists "Admins can read all audit entries" on public.audit_logs;
drop policy if exists "Admins can manage campaign funding" on public.campaign_funding;

create policy "Admin can access all profiles" on public.profiles
  for all using (public.current_user_has_role(array['admin']::text[]));

create policy "Admins manage roles" on public.user_roles
  for all using (public.current_user_has_role(array['admin']::text[]));

create policy "Admins and reviewers can access review queue" on public.task_submissions
  for select using (public.current_user_has_role(array['reviewer', 'admin']::text[]));

create policy "Finance and admins can see all withdrawal requests" on public.withdrawal_requests
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Finance and admins can read all ledger tables" on public.ledger_accounts
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Finance and admins can read all ledger transactions" on public.ledger_transactions
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Finance and admins can read all ledger entries" on public.ledger_entries
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Admins can manage advertisers" on public.advertiser_profiles
  for all using (public.current_user_has_role(array['admin']::text[]));

create policy "Admins can manage all campaigns" on public.campaigns
  for all using (public.current_user_has_role(array['admin']::text[]));

create policy "Admins can read all audit entries" on public.audit_logs
  for select using (public.current_user_has_role(array['admin']::text[]));

create policy "Admins can manage campaign funding" on public.campaign_funding
  for all to authenticated
  using (public.current_user_has_role(array['admin']::text[]))
  with check (public.current_user_has_role(array['admin']::text[]));

commit;
