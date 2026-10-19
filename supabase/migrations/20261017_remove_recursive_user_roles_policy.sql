-- Role lookup policies must not query user_roles through current_user_has_role:
-- doing so evaluates this table's RLS policies recursively.
begin;

drop policy if exists "Admins manage roles" on public.user_roles;

commit;
