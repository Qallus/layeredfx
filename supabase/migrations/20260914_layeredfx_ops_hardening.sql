-- Apply only to the separate LayeredFX Supabase project.
-- Covering index for the auth.users foreign key (advisor 0001).
-- rls_auto_enable() is invoked only by the ensure_rls event trigger; it must not be callable via /rest/v1/rpc (advisors 0028/0029).
create index if not exists lfx_ops_members_user_id_idx on public.lfx_ops_members (user_id);
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
