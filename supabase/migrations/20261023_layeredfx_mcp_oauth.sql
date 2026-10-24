-- NOT YET APPLIED. Apply to the LayeredFX Supabase project only, after review.
-- Claude (MCP) connections: OAuth clients registered by Claude, and the codes/access/refresh tokens issued when a
-- LayeredFX member approves one. Only SHA-256 hashes of secrets are stored. Server-only access through the
-- service role; RLS is enabled with no client policies.
create table public.lfx_mcp_clients (
  id text primary key check (id ~ '^mcp_[0-9a-f-]{36}$'),
  org_id uuid not null,
  name text not null check (length(name) between 1 and 100),
  redirect_uris text[] not null check (cardinality(redirect_uris) between 1 and 5),
  created_at timestamptz not null default now()
);
create index lfx_mcp_clients_org on public.lfx_mcp_clients(org_id);

create table public.lfx_mcp_grants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  kind text not null check (kind in ('code','access','refresh')),
  user_id uuid not null,
  client_id text not null references public.lfx_mcp_clients(id) on delete cascade,
  family uuid not null,
  connected_at timestamptz not null,
  code_challenge text check (code_challenge is null or length(code_challenge) <= 128),
  redirect_uri text check (redirect_uri is null or length(redirect_uri) <= 500),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (kind <> 'code' or (code_challenge is not null and redirect_uri is not null)),
  foreign key (org_id, user_id) references public.lfx_ops_members(org_id, user_id) on delete cascade
);
create index lfx_mcp_grants_family on public.lfx_mcp_grants(org_id, family);
create index lfx_mcp_grants_user on public.lfx_mcp_grants(org_id, user_id, kind) where revoked_at is null;

alter table public.lfx_mcp_clients enable row level security;
alter table public.lfx_mcp_grants enable row level security;
revoke all on public.lfx_mcp_clients, public.lfx_mcp_grants from anon, authenticated;
