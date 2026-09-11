-- Review draft only: not applied to a live project.
create table if not exists public.lfx_topbar_store (
 org_id uuid primary key, revision bigint not null default 0,
 items jsonb not null default '[]'::jsonb
);
alter table public.lfx_topbar_store enable row level security;
revoke all on public.lfx_topbar_store from anon, authenticated;
grant select, insert, update, delete on public.lfx_topbar_store to service_role;
