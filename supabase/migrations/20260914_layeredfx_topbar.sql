-- Applied to LayeredFX Supabase (tdywcdgbavfcsywejoka) as layeredfx_topbar. Source: docs/migration/sql/topbar-review-draft.sql,
-- with revision/array checks added to match the blog store.
create table if not exists public.lfx_topbar_store (
 org_id uuid primary key,
 revision bigint not null default 0 check (revision >= 0),
 items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array')
);
alter table public.lfx_topbar_store enable row level security;
revoke all on public.lfx_topbar_store from public, anon, authenticated;
grant select, insert, update, delete on public.lfx_topbar_store to service_role;
