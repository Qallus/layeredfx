-- REVIEW DRAFT ONLY. Do not apply without confirming the isolated LayeredFX target.
create table if not exists public.lfx_portal_accounts (
 org_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 kind text not null check (kind in ('residential','commercial','contractor','affiliate','vendor')),
 status text not null check (status in ('active','pending','suspended')),
 revision integer not null default 0 check (revision >= 0),
 state jsonb not null check (jsonb_typeof(state) = 'object'),
 updated_at timestamptz not null default now(),
 primary key (org_id,user_id)
);
alter table public.lfx_portal_accounts enable row level security;
revoke all on public.lfx_portal_accounts from anon, authenticated;
grant select,insert,update,delete on public.lfx_portal_accounts to service_role;
-- No browser policies: verified portal owner or active staff membership is required in the server API.
create index if not exists lfx_portal_review_idx on public.lfx_portal_accounts(org_id,status,updated_at desc);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('lfx-portal-media','lfx-portal-media',false,20971520,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do nothing;
-- No direct storage policies are granted. The server verifies owner and active portal status.
