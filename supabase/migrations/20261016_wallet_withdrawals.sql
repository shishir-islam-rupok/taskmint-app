-- TaskMint wallet withdrawals: safe request creation and finance/admin processing.
-- Compatibility note: existing app forms and wallet displays treat *_minor as whole BDT
-- values (not paisa). This migration intentionally preserves that existing convention.

begin;

alter table public.withdrawal_requests
  add column if not exists payout_account text,
  add column if not exists review_note text,
  add column if not exists idempotency_key uuid;

create unique index if not exists idx_withdrawals_user_idempotency
  on public.withdrawal_requests(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_withdrawal_requests_user_requested
  on public.withdrawal_requests(user_id, requested_at desc);

-- Users can only read their own requests through the existing policy. Finance/admin
-- can read all requests through the existing policy. Writes are routed through RPCs.

create or replace function public.request_withdrawal(
  p_amount_minor bigint,
  p_payout_method text,
  p_payout_account text,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet public.wallets%rowtype;
  v_existing_id uuid;
  v_request_id uuid;
  v_method text := nullif(trim(p_payout_method), '');
  v_account text := nullif(trim(p_payout_account), '');
begin
  if v_user_id is null then
    raise exception 'Sign in before requesting a withdrawal.';
  end if;

  if p_amount_minor is null or p_amount_minor < 100 then
    raise exception 'The minimum withdrawal is ৳100.';
  end if;

  if p_amount_minor > 100000000 then
    raise exception 'The requested amount is above the allowed limit.';
  end if;

  if p_idempotency_key is null then
    raise exception 'A withdrawal request key is required.';
  end if;

  if v_method is null or v_method not in ('bKash', 'Nagad', 'Rocket', 'Bank transfer') then
    raise exception 'Choose a supported payout method.';
  end if;

  if v_account is null or char_length(v_account) < 6 or char_length(v_account) > 120
     or v_account ~ '[[:cntrl:]]' then
    raise exception 'Enter valid payout account details.';
  end if;

  -- Lock the wallet row so concurrent requests cannot spend the same balance.
  select * into v_wallet
  from public.wallets w
  where w.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Your wallet could not be found.';
  end if;

  select wr.id into v_existing_id
  from public.withdrawal_requests wr
  where wr.user_id = v_user_id and wr.idempotency_key = p_idempotency_key;
  if found then
    return v_existing_id;
  end if;

  if v_wallet.currency <> 'BDT' then
    raise exception 'Withdrawals are currently available only for BDT wallets.';
  end if;

  if exists (
    select 1
    from public.withdrawal_requests wr
    where wr.user_id = v_user_id and wr.status in ('requested', 'processing')
  ) then
    raise exception 'You already have an active withdrawal request.';
  end if;

  if v_wallet.balance_minor < p_amount_minor then
    raise exception 'Insufficient available balance for this withdrawal.';
  end if;

  insert into public.withdrawal_requests (
    user_id, amount_minor, currency, payout_method, payout_account, idempotency_key, status
  ) values (
    v_user_id, p_amount_minor, 'BDT', v_method, v_account, p_idempotency_key, 'requested'
  ) returning id into v_request_id;

  update public.wallets
  set balance_minor = balance_minor - p_amount_minor,
      updated_at = now()
  where user_id = v_user_id;

  insert into public.wallet_transactions (
    user_id, task_id, title, source_type, reward_minor, status
  ) values (
    v_user_id, v_request_id::text, 'Withdrawal request', 'withdrawal_request', p_amount_minor, 'pending'
  );

  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_user_id,
    'wallet.withdrawal.requested',
    'withdrawal_request',
    v_request_id,
    jsonb_build_object(
      'amount_bdt', p_amount_minor,
      'payout_method', v_method,
      'currency', 'BDT',
      'payout_reference_present', false
    )
  );

  return v_request_id;
end;
$$;

create or replace function public.review_withdrawal_request(
  p_request_id uuid,
  p_decision text,
  p_provider_reference text default null,
  p_review_note text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_request public.withdrawal_requests%rowtype;
  v_reference text := nullif(trim(p_provider_reference), '');
  v_note text := nullif(trim(p_review_note), '');
begin
  if v_actor_id is null
     or not public.current_user_has_role(array['finance', 'admin']::text[]) then
    raise exception 'Finance or administrator access is required.';
  end if;

  if p_decision is null or p_decision not in ('processing', 'paid', 'rejected') then
    raise exception 'Choose a valid withdrawal decision.';
  end if;

  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'Review note must be 1000 characters or fewer.';
  end if;

  if p_decision = 'paid' and (v_reference is null or char_length(v_reference) < 4 or char_length(v_reference) > 200) then
    raise exception 'Enter the payout transaction reference before marking a withdrawal paid.';
  end if;

  select * into v_request
  from public.withdrawal_requests wr
  where wr.id = p_request_id
  for update;

  if not found then
    raise exception 'Withdrawal request not found.';
  end if;

  if v_request.status not in ('requested', 'processing') then
    raise exception 'This withdrawal request has already been finalized.';
  end if;

  if p_decision = 'rejected' then
    -- Refund the reserved amount exactly once when rejecting an active request.
    update public.wallets
    set balance_minor = balance_minor + v_request.amount_minor,
        updated_at = now()
    where user_id = v_request.user_id;

    if not found then
      raise exception 'The request owner wallet could not be found; no decision was applied.';
    end if;
  end if;

  update public.withdrawal_requests
  set status = p_decision,
      provider_reference = case when p_decision = 'paid' then v_reference else provider_reference end,
      review_note = coalesce(v_note, review_note),
      reviewer_id = v_actor_id,
      processed_at = case when p_decision in ('paid', 'rejected') then now() else null end
  where id = v_request.id;

  if p_decision in ('paid', 'rejected') then
    update public.wallet_transactions
    set status = case when p_decision = 'paid' then 'paid' else 'rejected' end
    where user_id = v_request.user_id
      and task_id = v_request.id::text
      and source_type = 'withdrawal_request'
      and status = 'pending';
    if not found then
      raise exception 'The pending withdrawal transaction could not be found.';
    end if;
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason, metadata)
  values (
    v_actor_id,
    'wallet.withdrawal.reviewed',
    'withdrawal_request',
    v_request.id,
    v_note,
    jsonb_build_object(
      'decision', p_decision,
      'amount_bdt', v_request.amount_minor,
      'user_id', v_request.user_id,
      'payout_reference_present', (p_decision = 'paid'),
      'transaction_status', case when p_decision = 'processing' then 'pending' else p_decision end
    )
  );

  return p_decision;
end;
$$;

revoke all on function public.request_withdrawal(bigint, text, text, uuid) from public, anon;
revoke all on function public.review_withdrawal_request(uuid, text, text, text) from public, anon;
grant execute on function public.request_withdrawal(bigint, text, text, uuid) to authenticated;
grant execute on function public.review_withdrawal_request(uuid, text, text, text) to authenticated;

commit;
