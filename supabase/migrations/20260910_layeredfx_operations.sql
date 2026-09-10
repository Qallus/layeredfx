-- Apply only to the separate LayeredFX Supabase project, after review.
-- No Channel Cast or ControlP tables, credentials, data or policies are touched.
-- A bounded JSONB store follows the source application's document/CRM pattern.
-- Server-side commands validate records; optimistic revision checks prevent lost updates.
begin;
create table if not exists public.lfx_ops_members (
 org_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 200),
 email text not null default '',
 role text not null check (role in ('admin','staff','viewer')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key (org_id,user_id)
);
create table if not exists public.lfx_ops_store (
 org_id uuid primary key,
 revision bigint not null default 0 check(revision>=0),
 state jsonb not null,
 updated_at timestamptz not null default now(),
 constraint lfx_state_object check(jsonb_typeof(state)='object'),
 constraint lfx_state_revision check(state ? 'revision' and jsonb_typeof(state->'revision')='number' and (state->>'revision')::bigint=revision),
 constraint lfx_state_schema check(state ? 'schemaVersion' and (state->>'schemaVersion')::integer=2)
);
alter table public.lfx_ops_members enable row level security;
alter table public.lfx_ops_store enable row level security;
-- Deliberately no browser/anon/authenticated data policies. Authentication is checked
-- by the Next.js server on EVERY API operation; only service_role accesses these tables.
revoke all on public.lfx_ops_members from anon,authenticated;
revoke all on public.lfx_ops_store from anon,authenticated;
grant select,insert,update,delete on public.lfx_ops_members to service_role;
grant select,insert,update,delete on public.lfx_ops_store to service_role;
commit;
