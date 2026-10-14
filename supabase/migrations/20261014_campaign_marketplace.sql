-- TaskMint sponsored-task marketplace: server-timed sessions, review queue, and funded rewards.
-- Apply after schema.sql. Campaign funding must be verified by an administrator before activation.

alter table public.campaigns
  add column if not exists watch_seconds smallint not null default 20,
  add column if not exists destination_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campaigns_watch_seconds_range'
      and conrelid = 'public.campaigns'::regclass
  ) then
    alter table public.campaigns
      add constraint campaigns_watch_seconds_range check (watch_seconds between 5 and 300);
  end if;
end;
$$;

alter table public.task_submissions
  alter column proof_storage_key drop not null,
  add column if not exists proof_text text,
  add column if not exists session_id uuid;

create table if not exists public.campaign_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  status text not null default 'started' check (status in ('started', 'completed', 'expired')),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'task_submissions_session_id_fkey'
      and conrelid = 'public.task_submissions'::regclass
  ) then
    alter table public.task_submissions
      add constraint task_submissions_session_id_fkey
      foreign key (session_id) references public.campaign_sessions(id) on delete set null;
  end if;
end;
$$;

create unique index if not exists advertiser_profiles_owner_user_id_key
  on public.advertiser_profiles(owner_user_id);
create index if not exists idx_campaign_sessions_user_campaign
  on public.campaign_sessions(user_id, campaign_id, started_at desc);
create index if not exists idx_campaign_submissions_campaign_status
  on public.task_submissions(campaign_id, status, submitted_at desc);

alter table public.campaign_sessions enable row level security;

-- Remove the old direct-insert path: submissions are created only by the verified RPC below.
drop policy if exists "Authenticated users can insert their own submissions" on public.task_submissions;
drop policy if exists "Advertisers can read campaign submissions" on public.task_submissions;
drop policy if exists "Users can read own campaign sessions" on public.campaign_sessions;
drop policy if exists "Advertisers can read own profile" on public.advertiser_profiles;
drop policy if exists "Users can create advertiser profile" on public.advertiser_profiles;
drop policy if exists "Advertisers can update pending profile" on public.advertiser_profiles;
drop policy if exists "Advertisers can read own campaigns" on public.campaigns;
drop policy if exists "Advertisers can create draft campaigns" on public.campaigns;
drop policy if exists "Advertisers can update draft campaigns" on public.campaigns;
drop policy if exists "Advertisers can read campaign funding" on public.campaign_funding;
drop policy if exists "Admins can manage campaign funding" on public.campaign_funding;
drop policy if exists "Authenticated users can read funded campaigns" on public.campaigns;
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

-- Wallet credits are granted only from reviewed, funded campaign submissions.
drop policy if exists "Users can insert own wallet" on public.wallets;
drop policy if exists "Users can update own wallet" on public.wallets;
drop policy if exists "Users can insert own wallet transactions" on public.wallet_transactions;

create or replace function public.campaign_has_verified_funding(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.campaigns c
    join public.campaign_funding cf on cf.campaign_id = c.id
    where c.id = p_campaign_id and cf.status = 'paid'
    group by c.id, c.budget_minor
    having sum(cf.amount_minor) >= c.budget_minor
  );
$$;

revoke all on function public.campaign_has_verified_funding(uuid) from public, anon;
grant execute on function public.campaign_has_verified_funding(uuid) to authenticated;

create policy "Advertisers can read own profile" on public.advertiser_profiles
  for select to authenticated using (owner_user_id = auth.uid());

create policy "Users can create advertiser profile" on public.advertiser_profiles
  for insert to authenticated with check (
    owner_user_id = auth.uid() and review_status = 'pending'
  );

create policy "Advertisers can update pending profile" on public.advertiser_profiles
  for update to authenticated
  using (owner_user_id = auth.uid() and review_status = 'pending')
  with check (owner_user_id = auth.uid() and review_status = 'pending');

create policy "Advertisers can read own campaigns" on public.campaigns
  for select to authenticated using (
    exists (
      select 1 from public.advertiser_profiles ap
      where ap.id = campaigns.advertiser_id and ap.owner_user_id = auth.uid()
    )
  );

create policy "Advertisers can create draft campaigns" on public.campaigns
  for insert to authenticated with check (
    state = 'draft' and review_status = 'pending'
    and exists (
      select 1 from public.advertiser_profiles ap
      where ap.id = campaigns.advertiser_id
        and ap.owner_user_id = auth.uid()
    )
  );

create policy "Advertisers can update draft campaigns" on public.campaigns
  for update to authenticated
  using (
    state = 'draft' and review_status = 'pending'
    and exists (
      select 1 from public.advertiser_profiles ap
      where ap.id = campaigns.advertiser_id and ap.owner_user_id = auth.uid()
    )
  )
  with check (
    state = 'draft' and review_status = 'pending'
    and exists (
      select 1 from public.advertiser_profiles ap
      where ap.id = campaigns.advertiser_id and ap.owner_user_id = auth.uid()
    )
  );

create policy "Authenticated users can read funded campaigns" on public.campaigns
  for select to authenticated using (
    state = 'active'
    and review_status = 'approved'
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at > now())
    and public.campaign_has_verified_funding(campaigns.id)
  );

create policy "Advertisers can read campaign funding" on public.campaign_funding
  for select to authenticated using (
    exists (
      select 1 from public.campaigns c
      join public.advertiser_profiles ap on ap.id = c.advertiser_id
      where c.id = campaign_funding.campaign_id and ap.owner_user_id = auth.uid()
    )
  );

create policy "Advertisers can read campaign submissions" on public.task_submissions
  for select to authenticated using (
    exists (
      select 1 from public.campaigns c
      join public.advertiser_profiles ap on ap.id = c.advertiser_id
      where c.id = task_submissions.campaign_id and ap.owner_user_id = auth.uid()
    )
  );

create policy "Admins can manage campaign funding" on public.campaign_funding
  for all to authenticated
  using (public.current_user_has_role(array['admin']::text[]))
  with check (public.current_user_has_role(array['admin']::text[]));

create policy "Users can read own campaign sessions" on public.campaign_sessions
  for select to authenticated using (user_id = auth.uid());

create or replace function public.submit_campaign_funding_request(
  p_campaign_id uuid,
  p_provider text,
  p_provider_reference text,
  p_amount_minor bigint
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_campaign public.campaigns%rowtype;
  v_reserved bigint;
  v_funding_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to request campaign funding.';
  end if;
  if p_provider is null or char_length(trim(p_provider)) < 2 or char_length(p_provider) > 60
    or p_provider_reference is null or char_length(trim(p_provider_reference)) < 4 or char_length(p_provider_reference) > 200
    or p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Provide a valid payment method, reference, and amount.';
  end if;

  select * into v_campaign
  from public.campaigns c
  where c.id = p_campaign_id
    and exists (
      select 1 from public.advertiser_profiles ap
      where ap.id = c.advertiser_id and ap.owner_user_id = v_user_id
    )
  for update;

  if not found or v_campaign.state <> 'draft' then
    raise exception 'Only your campaign drafts can request funding.';
  end if;

  select coalesce(sum(cf.amount_minor), 0) into v_reserved
  from public.campaign_funding cf
  where cf.campaign_id = v_campaign.id and cf.status in ('pending', 'paid');

  if p_amount_minor > v_campaign.budget_minor - v_reserved then
    raise exception 'Funding requests exceed the remaining campaign budget.';
  end if;

  insert into public.campaign_funding (
    campaign_id, provider, provider_reference, amount_minor, currency, status
  ) values (
    v_campaign.id, trim(p_provider), trim(p_provider_reference), p_amount_minor,
    v_campaign.currency, 'pending'
  ) returning id into v_funding_id;

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_user_id, 'campaign.funding.requested', 'campaign_funding', v_funding_id,
    jsonb_build_object('campaign_id', v_campaign.id, 'amount_minor', p_amount_minor, 'provider', trim(p_provider))
  );

  return v_funding_id;
end;
$$;

create or replace function public.approve_campaign(p_campaign_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_campaign public.campaigns%rowtype;
  v_funded bigint;
  v_advertiser_status text;
begin
  if v_actor_id is null or not public.current_user_has_role(array['admin']::text[]) then
    raise exception 'Administrator access is required.';
  end if;

  select * into v_campaign
  from public.campaigns c
  where c.id = p_campaign_id
  for update;

  if not found or v_campaign.state <> 'draft' or v_campaign.review_status <> 'pending' then
    raise exception 'This campaign is not awaiting approval.';
  end if;
  if v_campaign.budget_minor < v_campaign.reward_minor * v_campaign.slot_count then
    raise exception 'Campaign budget does not cover all reward slots.';
  end if;

  select ap.review_status into v_advertiser_status
  from public.advertiser_profiles ap
  where ap.id = v_campaign.advertiser_id;
  if v_advertiser_status <> 'approved' then
    raise exception 'Approve the advertiser profile before approving the campaign.';
  end if;

  select coalesce(sum(cf.amount_minor), 0) into v_funded
  from public.campaign_funding cf
  where cf.campaign_id = v_campaign.id and cf.status = 'paid';
  if v_funded < v_campaign.budget_minor then
    raise exception 'Verify full campaign funding before activation.';
  end if;

  update public.campaigns
  set state = 'active', review_status = 'approved', updated_at = now()
  where id = v_campaign.id;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_actor_id, 'campaign.approved', 'campaign', v_campaign.id);

  return 'active';
end;
$$;

create or replace function public.start_campaign_session(p_campaign_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_campaign public.campaigns%rowtype;
  v_funded bigint;
  v_slots_used bigint;
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to start a campaign.';
  end if;

  select * into v_campaign
  from public.campaigns c
  where c.id = p_campaign_id
  for update;

  if not found
    or v_campaign.state <> 'active'
    or v_campaign.review_status <> 'approved'
    or (v_campaign.start_at is not null and v_campaign.start_at > now())
    or (v_campaign.end_at is not null and v_campaign.end_at <= now()) then
    raise exception 'This campaign is not available.';
  end if;

  select coalesce(sum(cf.amount_minor), 0) into v_funded
  from public.campaign_funding cf
  where cf.campaign_id = v_campaign.id and cf.status = 'paid';

  if v_funded < v_campaign.budget_minor then
    raise exception 'This campaign is awaiting verified funding.';
  end if;

  select count(*) into v_slots_used
  from public.task_submissions ts
  where ts.campaign_id = v_campaign.id and ts.status in ('submitted', 'approved');

  if v_slots_used >= v_campaign.slot_count then
    raise exception 'All campaign slots have been claimed.';
  end if;

  if exists (
    select 1 from public.task_submissions ts
    where ts.campaign_id = v_campaign.id and ts.user_id = v_user_id
  ) then
    raise exception 'You have already submitted this campaign.';
  end if;

  update public.campaign_sessions
  set status = 'expired'
  where campaign_id = v_campaign.id
    and user_id = v_user_id
    and status = 'started'
    and expires_at <= now();

  if exists (
    select 1 from public.campaign_sessions cs
    where cs.campaign_id = v_campaign.id
      and cs.user_id = v_user_id
      and cs.status = 'started'
      and cs.expires_at > now()
  ) then
    raise exception 'You already have an active session for this campaign.';
  end if;

  insert into public.campaign_sessions (campaign_id, user_id, expires_at)
  values (
    v_campaign.id,
    v_user_id,
    now() + make_interval(secs => v_campaign.watch_seconds::double precision)
  )
  returning id into v_session_id;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_user_id, 'campaign.session.started', 'campaign', v_campaign.id);

  return v_session_id;
end;
$$;

create or replace function public.complete_campaign_session(
  p_session_id uuid,
  p_proof_text text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.campaign_sessions%rowtype;
  v_campaign public.campaigns%rowtype;
  v_funded bigint;
  v_slots_used bigint;
  v_submission_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to submit campaign work.';
  end if;

  if p_proof_text is null or char_length(trim(p_proof_text)) < 10 or char_length(p_proof_text) > 2000 then
    raise exception 'Add a short completion note (10 to 2000 characters).';
  end if;

  select * into v_session
  from public.campaign_sessions cs
  where cs.id = p_session_id and cs.user_id = v_user_id
  for update;

  if not found or v_session.status <> 'started' then
    raise exception 'This campaign session is not active.';
  end if;

  if now() < v_session.expires_at then
    raise exception 'The required viewing time has not elapsed yet.';
  end if;

  select * into v_campaign
  from public.campaigns c
  where c.id = v_session.campaign_id
  for update;

  if v_campaign.state <> 'active' or v_campaign.review_status <> 'approved' then
    raise exception 'This campaign is no longer available.';
  end if;

  select coalesce(sum(cf.amount_minor), 0) into v_funded
  from public.campaign_funding cf
  where cf.campaign_id = v_campaign.id and cf.status = 'paid';

  if v_funded < v_campaign.budget_minor then
    raise exception 'This campaign is awaiting verified funding.';
  end if;

  select count(*) into v_slots_used
  from public.task_submissions ts
  where ts.campaign_id = v_campaign.id and ts.status in ('submitted', 'approved');

  if v_slots_used >= v_campaign.slot_count then
    raise exception 'All campaign slots have been claimed.';
  end if;

  insert into public.task_submissions (
    campaign_id, user_id, session_id, proof_text, status, submitted_at
  ) values (
    v_campaign.id, v_user_id, v_session.id, trim(p_proof_text), 'submitted', now()
  ) returning id into v_submission_id;

  update public.campaign_sessions
  set status = 'completed', completed_at = now()
  where id = v_session.id;

  insert into public.wallets (user_id, currency)
  values (v_user_id, v_campaign.currency)
  on conflict (user_id) do nothing;

  update public.wallets
  set pending_minor = pending_minor + v_campaign.reward_minor,
      updated_at = now()
  where user_id = v_user_id;

  insert into public.wallet_transactions (
    user_id, task_id, title, source_type, reward_minor, status
  ) values (
    v_user_id, v_campaign.id::text, v_campaign.title, 'campaign_submission',
    v_campaign.reward_minor, 'pending'
  );

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_user_id, 'campaign.submission.created', 'task_submission', v_submission_id,
    jsonb_build_object('campaign_id', v_campaign.id, 'session_id', v_session.id)
  );

  return v_submission_id;
end;
$$;

create or replace function public.review_campaign_submission(
  p_submission_id uuid,
  p_decision text,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_submission public.task_submissions%rowtype;
  v_campaign public.campaigns%rowtype;
  v_is_admin boolean;
  v_is_owner boolean;
begin
  if v_actor_id is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review request.';
  end if;

  select * into v_submission
  from public.task_submissions ts
  where ts.id = p_submission_id
  for update;

  if not found or v_submission.status <> 'submitted' then
    raise exception 'This submission is no longer awaiting review.';
  end if;

  select * into v_campaign
  from public.campaigns c
  where c.id = v_submission.campaign_id
  for update;

  select exists (
    select 1 from public.advertiser_profiles ap
    where ap.id = v_campaign.advertiser_id and ap.owner_user_id = v_actor_id
  ) into v_is_owner;

  v_is_admin := public.current_user_has_role(array['reviewer', 'admin']::text[]);

  if not v_is_owner and not v_is_admin then
    raise exception 'You are not allowed to review this campaign.';
  end if;
  if v_is_owner and v_submission.user_id = v_actor_id then
    raise exception 'You cannot review your own campaign submission.';
  end if;

  if p_decision = 'approved' then
    if v_campaign.state <> 'active' or v_campaign.review_status <> 'approved' then
      raise exception 'The campaign is not active.';
    end if;

    update public.wallets
    set balance_minor = balance_minor + v_campaign.reward_minor,
        pending_minor = greatest(0, pending_minor - v_campaign.reward_minor),
        approved_minor = approved_minor + v_campaign.reward_minor,
        updated_at = now()
    where user_id = v_submission.user_id;

    if not found then
      raise exception 'The earner wallet could not be found.';
    end if;
  else
    update public.wallets
    set pending_minor = greatest(0, pending_minor - v_campaign.reward_minor),
        updated_at = now()
    where user_id = v_submission.user_id;
  end if;

  update public.task_submissions
  set status = p_decision,
      reviewer_id = v_actor_id,
      rejection_reason = case when p_decision = 'rejected' then nullif(trim(p_reason), '') else null end,
      reviewed_at = now()
  where id = v_submission.id and status = 'submitted';

  if not found then
    raise exception 'This submission has already been reviewed.';
  end if;

  update public.wallet_transactions
  set status = case when p_decision = 'approved' then 'approved' else 'rejected' end
  where user_id = v_submission.user_id
    and task_id = v_campaign.id::text
    and source_type = 'campaign_submission'
    and status = 'pending';

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason, metadata)
  values (
    v_actor_id, 'campaign.submission.reviewed', 'task_submission', v_submission.id,
    nullif(trim(p_reason), ''),
    jsonb_build_object('decision', p_decision, 'campaign_id', v_campaign.id, 'earner_id', v_submission.user_id)
  );

  return p_decision;
end;
$$;

revoke all on function public.start_campaign_session(uuid) from public, anon;
revoke all on function public.complete_campaign_session(uuid, text) from public, anon;
revoke all on function public.review_campaign_submission(uuid, text, text) from public, anon;
revoke all on function public.submit_campaign_funding_request(uuid, text, text, bigint) from public, anon;
revoke all on function public.approve_campaign(uuid) from public, anon;
grant execute on function public.start_campaign_session(uuid) to authenticated;
grant execute on function public.complete_campaign_session(uuid, text) to authenticated;
grant execute on function public.review_campaign_submission(uuid, text, text) to authenticated;
grant execute on function public.submit_campaign_funding_request(uuid, text, text, bigint) to authenticated;
grant execute on function public.approve_campaign(uuid) to authenticated;
