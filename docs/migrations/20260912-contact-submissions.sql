-- LayeredFX only. Review and apply to authorized staging before production.
create table if not exists public.lfx_contact_submissions (
 org_id uuid not null,
 id uuid not null,
 created_at timestamptz not null default now(),
 details jsonb not null,
 files jsonb not null default '[]'::jsonb,
 primary key(org_id,id),
 check (octet_length(details::text)<30000),
 check (octet_length(files::text)<9000000)
);
create index if not exists lfx_contact_submissions_created on public.lfx_contact_submissions(org_id,created_at desc);
alter table public.lfx_contact_submissions enable row level security;
revoke all on public.lfx_contact_submissions from public,anon,authenticated;
grant select,insert,update,delete on public.lfx_contact_submissions to service_role;
