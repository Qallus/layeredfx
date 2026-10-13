-- Applied to LayeredFX Supabase (tdywcdgbavfcsywejoka) on 2026-10-12 via the SQL editor.
-- Job Daily Logs: rich-text notes, voice notes (with an optional on-device transcript) and photos, each attached to a
-- job in the operations record (lfx_ops_store state.jobs). Files live in the private lfx-job-log-media bucket under
-- {org_id}/{job_id}/{log_id}/{media_id}. Server-only access through the service role; no client policies.
create table public.lfx_job_logs (
  id uuid primary key,
  org_id uuid not null,
  job_id text not null check (job_id ~ '^job_[0-9a-f-]{36}$'),
  job_name text not null default '' check (length(job_name) <= 200),
  kind text not null check (kind in ('note','voice','photo')),
  log_date date not null,
  title text not null default '' check (length(title) <= 200),
  content jsonb not null default '[]'::jsonb check (jsonb_typeof(content) = 'array' and pg_column_size(content) <= 400000),
  body text not null default '' check (length(body) <= 20000),
  transcript_source text check (transcript_source in ('device')),
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 20 and pg_column_size(media) <= 40000),
  created_by uuid not null,
  created_by_name text not null default '' check (length(created_by_name) <= 200),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'note' or media = '[]'::jsonb),
  check (kind <> 'voice' or jsonb_array_length(media) = 1),
  check (kind <> 'photo' or jsonb_array_length(media) between 1 and 20),
  unique (org_id, id),
  foreign key (org_id, created_by) references public.lfx_ops_members(org_id, user_id)
);
create index lfx_job_logs_job on public.lfx_job_logs(org_id, job_id, log_date desc, created_at desc);
create index lfx_job_logs_recent on public.lfx_job_logs(org_id, log_date desc, created_at desc);
create index lfx_job_logs_author on public.lfx_job_logs(org_id, created_by);

alter table public.lfx_job_logs enable row level security;
revoke all on public.lfx_job_logs from public, anon, authenticated;
grant select, insert, update, delete on public.lfx_job_logs to service_role;

-- Private bucket. MIME types are the base types the API stores (codec parameters are stripped before upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lfx-job-log-media', 'lfx-job-log-media', false, 26214400,
        array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'])
on conflict (id) do nothing;
