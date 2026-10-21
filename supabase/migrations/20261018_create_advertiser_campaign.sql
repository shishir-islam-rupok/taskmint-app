-- Create an advertiser-owned campaign draft in one authenticated database request.
create or replace function public.create_advertiser_campaign(
  p_title text,
  p_category text,
  p_description text,
  p_instructions text,
  p_reward_minor bigint,
  p_slot_count integer,
  p_watch_seconds smallint,
  p_destination_url text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_advertiser_id uuid;
  v_campaign_id uuid;
  v_destination_url text := nullif(btrim(p_destination_url), '');
begin
  if v_user_id is null then
    raise exception 'Sign in to post a campaign.';
  end if;

  if p_title is null or char_length(btrim(p_title)) not between 4 and 120
    or p_category is null or char_length(btrim(p_category)) not between 2 and 60
    or p_description is null or char_length(btrim(p_description)) not between 15 and 1000
    or p_instructions is null or char_length(btrim(p_instructions)) not between 10 and 1500
    or p_reward_minor is null or p_reward_minor not between 1 and 100000
    or p_slot_count is null or p_slot_count not between 1 and 10000
    or p_watch_seconds is null or p_watch_seconds not between 5 and 300 then
    raise exception 'Campaign details are invalid.';
  end if;

  if v_destination_url is not null and (
    char_length(v_destination_url) > 2048
    or v_destination_url !~* '^https?://[^[:space:]/?#]+([/:?#]|$)'
  ) then
    raise exception 'Destination must use a valid http or https URL.';
  end if;

  select ap.id into v_advertiser_id
  from public.advertiser_profiles ap
  where ap.owner_user_id = v_user_id;

  if v_advertiser_id is null then
    raise exception 'Create a provider profile before posting a campaign.';
  end if;

  insert into public.campaigns (
    advertiser_id,
    title,
    category,
    description,
    instructions,
    reward_minor,
    currency,
    slot_count,
    budget_minor,
    watch_seconds,
    destination_url,
    state,
    review_status
  )
  values (
    v_advertiser_id,
    btrim(p_title),
    btrim(p_category),
    btrim(p_description),
    btrim(p_instructions),
    p_reward_minor,
    'BDT',
    p_slot_count,
    p_reward_minor * p_slot_count,
    p_watch_seconds,
    v_destination_url,
    'draft',
    'pending'
  )
  returning id into v_campaign_id;

  return v_campaign_id;
end;
$$;

revoke all on function public.create_advertiser_campaign(text, text, text, text, bigint, integer, smallint, text) from public, anon;
grant execute on function public.create_advertiser_campaign(text, text, text, text, bigint, integer, smallint, text) to authenticated;
