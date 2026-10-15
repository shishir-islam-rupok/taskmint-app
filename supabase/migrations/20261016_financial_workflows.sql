-- Server-owned financial transitions: no client writes to wallet/subscription tables.
-- Existing wallet *_minor columns are currently treated as integer BDT units by the app.
-- This migration preserves stored values; do not rescale history without a separate audit.
begin;

alter table public.withdrawal_requests
  add column if not exists review_note text,
  add column if not exists idempotency_key uuid;

create unique index if not exists idx_withdrawals_user_idempotency
  on public.withdrawal_requests(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_withdrawals_user_status_created
  on public.withdrawal_requests(user_id, status, requested_at desc);

-- All money and subscription state changes go through SECURITY DEFINER functions.
drop policy if exists "Users can insert own wallet" on public.wallets;
drop policy if exists "Users can update own wallet" on public.wallets;
drop policy if exists "Users can insert own wallet transactions" on public.wallet_transactions;
drop policy if exists "Users can insert their subscriptions" on public.user_subscriptions;
drop policy if exists "Users can update their subscriptions" on public.user_subscriptions;
drop policy if exists "Users can insert own withdrawal requests" on public.withdrawal_requests;
drop policy if exists "Users can update own withdrawal requests" on public.withdrawal_requests;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Authenticated users can insert their own submissions" on public.task_submissions;
drop policy if exists "Admins can manage advertisers" on public.advertiser_profiles;
drop policy if exists "Admins can manage all campaigns" on public.campaigns;
drop policy if exists "Admins can manage campaign funding" on public.campaign_funding;
drop policy if exists "Admins can read advertisers" on public.advertiser_profiles;
drop policy if exists "Admins can read all advertisers" on public.advertiser_profiles;
drop policy if exists "Admins can read all campaigns" on public.campaigns;
drop policy if exists "Admins can read campaign funding" on public.campaign_funding;

create policy "Admins can read all advertisers" on public.advertiser_profiles
  for select to authenticated using (public.current_user_has_role(array['admin']::text[]));
create policy "Admins can read all campaigns" on public.campaigns
  for select to authenticated using (public.current_user_has_role(array['admin']::text[]));
create policy "Admins can read campaign funding" on public.campaign_funding
  for select to authenticated using (public.current_user_has_role(array['admin']::text[]));

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
  v_wallet public.wallets%rowtype;
  v_transaction_id uuid;
  v_funded bigint;
  v_is_owner boolean;
begin
  if v_actor_id is null or p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review request.';
  end if;
  if p_reason is not null and char_length(p_reason) > 1000 then
    raise exception 'Review note must be 1000 characters or fewer.';
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
  if not found then
    raise exception 'The submitted campaign could not be found.';
  end if;

  select exists (
    select 1 from public.advertiser_profiles ap
    where ap.id = v_campaign.advertiser_id and ap.owner_user_id = v_actor_id
  ) into v_is_owner;

  if not v_is_owner and not public.current_user_has_role(array['reviewer', 'admin']::text[]) then
    raise exception 'You are not allowed to review this campaign.';
  end if;
  if v_is_owner and v_submission.user_id = v_actor_id then
    raise exception 'You cannot review your own campaign submission.';
  end if;

  select wt.id into v_transaction_id
  from public.wallet_transactions wt
  where wt.user_id = v_submission.user_id
    and wt.task_id = v_campaign.id::text
    and wt.source_type = 'campaign_submission'
    and wt.status = 'pending'
  for update;
  if v_transaction_id is null then
    raise exception 'The pending reward transaction could not be found.';
  end if;

  select * into v_wallet
  from public.wallets w
  where w.user_id = v_submission.user_id
  for update;
  if not found or v_wallet.pending_minor < v_campaign.reward_minor then
    raise exception 'The pending wallet balance is inconsistent with this reward.';
  end if;

  if p_decision = 'approved' then
    if v_campaign.state <> 'active' or v_campaign.review_status <> 'approved' then
      raise exception 'The campaign is not active.';
    end if;

    select coalesce(sum(cf.amount_minor), 0) into v_funded
    from public.campaign_funding cf
    where cf.campaign_id = v_campaign.id and cf.status = 'paid';
    if v_funded < v_campaign.budget_minor then
      raise exception 'The campaign is no longer fully funded.';
    end if;

    update public.wallets
    set balance_minor = balance_minor + v_campaign.reward_minor,
        pending_minor = pending_minor - v_campaign.reward_minor,
        approved_minor = approved_minor + v_campaign.reward_minor,
        updated_at = now()
    where id = v_wallet.id;
  else
    update public.wallets
    set pending_minor = pending_minor - v_campaign.reward_minor,
        updated_at = now()
    where id = v_wallet.id;
  end if;

  update public.task_submissions
  set status = p_decision,
      reviewer_id = v_actor_id,
      rejection_reason = case when p_decision = 'rejected' then nullif(trim(p_reason), '') else null end,
      reviewed_at = now()
  where id = v_submission.id and status = 'submitted';
  if not found then
    raise exception 'This submission was already reviewed.';
  end if;

  update public.wallet_transactions
  set status = case when p_decision = 'approved' then 'approved' else 'rejected' end
  where id = v_transaction_id and status = 'pending';
  if not found then
    raise exception 'The pending reward transaction was already processed.';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason, metadata)
  values (
    v_actor_id,
    'campaign.submission.reviewed',
    'task_submission',
    v_submission.id,
    nullif(trim(p_reason), ''),
    jsonb_build_object('decision', p_decision, 'campaign_id', v_campaign.id, 'earner_id', v_submission.user_id, 'reward_minor', v_campaign.reward_minor)
  );

  return p_decision;
end;
$$;

create or replace function public.activate_free_subscription(p_plan_key text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan public.subscription_plans%rowtype;
begin
  if v_user_id is null then
    raise exception 'Sign in to activate a plan.';
  end if;

  select * into v_plan
  from public.subscription_plans sp
  where sp.key = p_plan_key
  for share;

  if not found then
    raise exception 'Selected subscription plan was not found.';
  end if;
  if v_plan.price_minor <> 0 then
    raise exception 'Paid subscriptions are unavailable until a payment provider is configured.';
  end if;

  insert into public.user_subscriptions (user_id, plan_key, status, started_at, ends_at)
  values (
    v_user_id,
    v_plan.key,
    'active',
    now(),
    now() + make_interval(days => greatest(v_plan.duration_days, 1))
  )
  on conflict (user_id, plan_key) do update
  set status = 'active', started_at = excluded.started_at, ends_at = excluded.ends_at;

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_user_id,
    'subscription.free_activated',
    'subscription_plan',
    v_plan.id,
    jsonb_build_object('plan_key', v_plan.key)
  );

  return v_plan.name;
end;
$$;

create or replace function public.review_advertiser_profile(
  p_profile_id uuid,
  p_decision text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_profile public.advertiser_profiles%rowtype;
begin
  if v_actor_id is null or not public.current_user_has_role(array['admin']::text[]) then
    raise exception 'Administrator access is required.';
  end if;
  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid provider review decision.';
  end if;

  select * into v_profile
  from public.advertiser_profiles ap
  where ap.id = p_profile_id
  for update;

  if not found or v_profile.review_status <> 'pending' then
    raise exception 'This provider profile is no longer pending.';
  end if;

  update public.advertiser_profiles
  set review_status = p_decision, updated_at = now()
  where id = v_profile.id;

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'advertiser.profile.reviewed',
    'advertiser_profile',
    v_profile.id,
    jsonb_build_object('decision', p_decision, 'owner_user_id', v_profile.owner_user_id)
  );

  return p_decision;
end;
$$;

create or replace function public.review_campaign_funding(
  p_funding_id uuid,
  p_decision text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_funding public.campaign_funding%rowtype;
begin
  if v_actor_id is null or not public.current_user_has_role(array['admin']::text[]) then
    raise exception 'Administrator access is required.';
  end if;
  if p_decision is null or p_decision not in ('paid', 'rejected') then
    raise exception 'Invalid funding review decision.';
  end if;

  select * into v_funding
  from public.campaign_funding cf
  where cf.id = p_funding_id
  for update;

  if not found or v_funding.status <> 'pending' then
    raise exception 'This funding request is no longer pending.';
  end if;

  update public.campaign_funding
  set status = p_decision, updated_at = now()
  where id = v_funding.id;

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'campaign.funding.reviewed',
    'campaign_funding',
    v_funding.id,
    jsonb_build_object(
      'decision', p_decision,
      'campaign_id', v_funding.campaign_id,
      'amount_minor', v_funding.amount_minor,
      'provider', v_funding.provider,
      'provider_reference', v_funding.provider_reference
    )
  );

  return p_decision;
end;
$$;

create or replace function public.cancel_withdrawal_request(p_withdrawal_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_withdrawal public.withdrawal_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'Sign in to cancel a withdrawal request.';
  end if;

  select * into v_withdrawal
  from public.withdrawal_requests wr
  where wr.id = p_withdrawal_id and wr.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Withdrawal request not found.';
  end if;
  if v_withdrawal.status = 'cancelled' then
    return 'cancelled';
  end if;
  if v_withdrawal.status <> 'requested' then
    raise exception 'Only a pending withdrawal can be cancelled.';
  end if;

  update public.wallets
  set balance_minor = balance_minor + v_withdrawal.amount_minor,
      updated_at = now()
  where user_id = v_user_id;
  if not found then
    raise exception 'The request wallet could not be found for release.';
  end if;

  update public.withdrawal_requests
  set status = 'cancelled', processed_at = now(), review_note = 'Cancelled by account owner'
  where id = v_withdrawal.id and status = 'requested';
  if not found then
    raise exception 'This withdrawal was already reviewed.';
  end if;

  update public.wallet_transactions
  set status = 'cancelled'
  where user_id = v_user_id
    and task_id = v_withdrawal.id::text
    and source_type = 'withdrawal_request'
    and status = 'pending';
  if not found then
    raise exception 'The withdrawal transaction record could not be found.';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_user_id,
    'withdrawal.cancelled',
    'withdrawal_request',
    v_withdrawal.id,
    jsonb_build_object('amount_minor', v_withdrawal.amount_minor, 'currency', v_withdrawal.currency)
  );

  return 'cancelled';
end;
$$;

revoke all on function public.activate_free_subscription(text) from public, anon;
revoke all on function public.review_advertiser_profile(uuid, text) from public, anon;
revoke all on function public.review_campaign_funding(uuid, text) from public, anon;
revoke all on function public.cancel_withdrawal_request(uuid) from public, anon;
grant execute on function public.activate_free_subscription(text) to authenticated;
grant execute on function public.review_advertiser_profile(uuid, text) to authenticated;
grant execute on function public.review_campaign_funding(uuid, text) to authenticated;
grant execute on function public.cancel_withdrawal_request(uuid) to authenticated;

commit;
