-- Review draft; not applied. Server-only blog storage, isolated by LayeredFX organization.
create table if not exists public.lfx_blog_store (
 org_id uuid primary key,
 revision bigint not null default 0 check (revision >= 0),
 items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array')
);
alter table public.lfx_blog_store enable row level security;
revoke all on public.lfx_blog_store from anon, authenticated;
grant select, insert, update, delete on public.lfx_blog_store to service_role;
