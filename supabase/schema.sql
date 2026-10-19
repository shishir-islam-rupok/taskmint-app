-- TaskMint production schema foundation
-- This SQL is intended for Supabase/Postgres and should be run through migrations.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  locale text not null default 'en',
  account_status text not null default 'pending_verification',
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_minor bigint not null default 0,
  pending_minor bigint not null default 0,
  approved_minor bigint not null default 0,
  currency text not null default 'BDT',
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id text,
  title text not null,
  source_type text not null default 'task_reward',
  reward_minor bigint not null default 0,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  type text not null default 'subscription',
  price_minor bigint not null default 0,
  duration_days integer not null default 30,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_key text not null references public.subscription_plans(key) on delete restrict,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, plan_key)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.advertiser_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text,
  contact_email text,
  contact_phone text,
  website text,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertiser_profiles(id) on delete cascade,
  title text not null,
  category text not null,
  description text not null,
  instructions text not null,
  reward_minor bigint not null check (reward_minor >= 0),
  currency text not null default 'BDT',
  eligibility_rules jsonb not null default '{}'::jsonb,
  slot_count integer not null check (slot_count > 0),
  budget_minor bigint not null check (budget_minor >= 0),
  start_at timestamptz,
  end_at timestamptz,
  state text not null default 'draft',
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_funding (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'BDT',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_storage_key text not null,
  status text not null default 'submitted',
  reviewer_id uuid references public.profiles(id),
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (campaign_id, user_id)
);

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null,
  owner_id uuid,
  account_type text not null,
  currency text not null default 'BDT',
  balance_minor bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  source_event text not null,
  source_ref text,
  idempotency_key text not null unique,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions(id) on delete cascade,
  account_id uuid not null references public.ledger_accounts(id) on delete cascade,
  direction text not null check (direction in ('debit', 'credit')),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'BDT',
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'BDT',
  payout_method text not null,
  payout_account text,
  status text not null default 'requested',
  provider_reference text,
  idempotency_key uuid,
  review_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  reviewer_id uuid references public.profiles(id)
);

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  signature_status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  processing_state text not null default 'received',
  received_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.profiles(id),
  campaign_id uuid references public.campaigns(id),
  submission_id uuid references public.task_submissions(id),
  severity text not null default 'medium',
  review_state text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists idx_user_roles_role on public.user_roles(role);
create index if not exists idx_campaigns_state on public.campaigns(state);
create index if not exists idx_submissions_status on public.task_submissions(status);
create index if not exists idx_ledger_entries_account on public.ledger_entries(account_id);
create index if not exists idx_withdrawal_requests_status on public.withdrawal_requests(status);
create unique index if not exists idx_withdrawals_user_idempotency
  on public.withdrawal_requests(user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists idx_withdrawals_user_status_created
  on public.withdrawal_requests(user_id, status, requested_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.advertiser_profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_funding enable row level security;
alter table public.task_submissions enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.provider_webhook_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.risk_events enable row level security;

create or replace function public.current_user_has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = any(p_roles)
  );
$$;

revoke all on function public.current_user_has_role(text[]) from public, anon;
grant execute on function public.current_user_has_role(text[]) to authenticated;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can view own wallet" on public.wallets
  for select using (auth.uid() = user_id);

create policy "Users can view own wallet transactions" on public.wallet_transactions
  for select using (auth.uid() = user_id);

create policy "Users can view their subscriptions" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create policy "Public can read subscription plans" on public.subscription_plans
  for select using (true);

create policy "Admin can access all profiles" on public.profiles
  for all using (public.current_user_has_role(array['admin']::text[]));

create policy "Users can read their own roles" on public.user_roles
  for select using (user_id = auth.uid());

create policy "Authenticated users can read their own submissions" on public.task_submissions
  for select using (user_id = auth.uid());

create policy "Admins and reviewers can access review queue" on public.task_submissions
  for select using (public.current_user_has_role(array['reviewer', 'admin']::text[]));

create policy "Users can read their own withdrawal requests" on public.withdrawal_requests
  for select using (user_id = auth.uid());

create policy "Finance and admins can see all withdrawal requests" on public.withdrawal_requests
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Finance and admins can read all ledger tables" on public.ledger_accounts
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Finance and admins can read all ledger transactions" on public.ledger_transactions
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Finance and admins can read all ledger entries" on public.ledger_entries
  for select using (public.current_user_has_role(array['finance', 'admin']::text[]));

create policy "Admins can read all advertisers" on public.advertiser_profiles
  for select using (public.current_user_has_role(array['admin']::text[]));

create policy "Advertisers can view own campaigns" on public.campaigns
  for select using (
    exists (
      select 1
      from public.advertiser_profiles ap
      where ap.id = campaigns.advertiser_id and ap.owner_user_id = auth.uid()
    )
  );

create policy "Admins can read all campaigns" on public.campaigns
  for select using (public.current_user_has_role(array['admin']::text[]));

create policy "Users can read audit entries linked to themselves" on public.audit_logs
  for select using (actor_id = auth.uid());

create policy "Admins can read all audit entries" on public.audit_logs
  for select using (public.current_user_has_role(array['admin']::text[]));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale, account_status, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'TaskMint User'),
    coalesce(new.raw_user_meta_data->>'locale', 'en'),
    'pending_verification',
    coalesce((new.email_confirmed_at is not null), false)
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.update_updated_at();

create trigger advertiser_profiles_updated_at
before update on public.advertiser_profiles
for each row execute procedure public.update_updated_at();

create trigger campaigns_updated_at
before update on public.campaigns
for each row execute procedure public.update_updated_at();

create trigger campaign_funding_updated_at
before update on public.campaign_funding
for each row execute procedure public.update_updated_at();

create trigger ledger_accounts_updated_at
before update on public.ledger_accounts
for each row execute procedure public.update_updated_at();

create trigger ledger_transactions_updated_at
before update on public.ledger_transactions
for each row execute procedure public.update_updated_at();
