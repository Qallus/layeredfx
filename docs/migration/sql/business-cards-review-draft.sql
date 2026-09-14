-- REVIEW DRAFT: not applied and not yet generated as a migration by the Supabase CLI.
-- Derived from Channel Cast OS lib/business-cards (JSONB CRM collections business_cards,
-- card_leads, card_events), normalized for LayeredFX organization-scoped storage.
-- Run only on an explicitly authorized, isolated LayeredFX staging database.
begin;

create table public.lfx_business_cards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  owner_id uuid,
  slug text not null check (slug ~ '^[a-z0-9]([a-z0-9-]{0,58}[a-z0-9])?$'),
  status text not null default 'draft' check (status in ('draft','published','unpublished','archived')),
  card jsonb not null check (jsonb_typeof(card) = 'object' and pg_column_size(card) <= 200000),
  view_count bigint not null default 0 check (view_count >= 0),
  click_count bigint not null default 0 check (click_count >= 0),
  share_count bigint not null default 0 check (share_count >= 0),
  save_count bigint not null default 0 check (save_count >= 0),
  revision bigint not null default 0 check (revision >= 0),
  changed_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug),
  unique (org_id, id),
  foreign key (org_id, owner_id) references public.lfx_ops_members(org_id, user_id),
  foreign key (org_id, changed_by) references public.lfx_ops_members(org_id, user_id)
);
create index lfx_business_cards_owner on public.lfx_business_cards(org_id, owner_id, updated_at desc);

-- Leads are retained history: a card with leads cannot be deleted (archive it instead).
create table public.lfx_card_leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  card_id uuid not null,
  owner_id uuid,
  card_name text not null default '' check (length(card_name) <= 200),
  name text not null default '' check (length(name) <= 120),
  email text not null default '' check (length(email) <= 254),
  phone text not null default '' check (length(phone) <= 40),
  company text not null default '' check (length(company) <= 120),
  message text not null default '' check (length(message) <= 2000),
  source text not null default 'public_card' check (length(source) <= 40),
  status text not null default 'new' check (status in ('new','contacted','qualified','archived')),
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  foreign key (org_id, card_id) references public.lfx_business_cards(org_id, id) on delete restrict
);
create index lfx_card_leads_owner on public.lfx_card_leads(org_id, owner_id, created_at desc);
create index lfx_card_leads_card on public.lfx_card_leads(org_id, card_id);

create table public.lfx_card_events (
  id bigint generated always as identity primary key,
  org_id uuid not null,
  card_id uuid not null,
  link_id text check (link_id is null or link_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  event_type text not null check (event_type in ('view','share','like','qr_scan','nfc_tap','link_click','copy_link','save_contact','lead_submit')),
  source text not null default 'public_card' check (length(source) <= 40),
  device_type text not null default 'desktop' check (device_type in ('desktop','mobile','tablet')),
  created_at timestamptz not null default now(),
  foreign key (org_id, card_id) references public.lfx_business_cards(org_id, id) on delete cascade
);
create index lfx_card_events_card_time on public.lfx_card_events(org_id, card_id, created_at);

-- Records one event and increments the matching counter atomically. Counters never
-- change the card revision, so public traffic cannot make an editor's save stale.
-- Only published cards accept events.
create function public.lfx_record_card_event(p_org uuid, p_card uuid, p_type text, p_link text, p_source text, p_device text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.lfx_business_cards set
    view_count = view_count + (case when p_type in ('view','qr_scan','nfc_tap') then 1 else 0 end),
    click_count = click_count + (case when p_type in ('link_click','copy_link') then 1 else 0 end),
    share_count = share_count + (case when p_type = 'share' then 1 else 0 end),
    save_count = save_count + (case when p_type = 'save_contact' then 1 else 0 end)
  where org_id = p_org and id = p_card and status = 'published';
  if found then
    insert into public.lfx_card_events(org_id, card_id, link_id, event_type, source, device_type)
    values (p_org, p_card, p_link, p_type, left(coalesce(p_source, 'public_card'), 40), coalesce(p_device, 'desktop'));
  end if;
end;
$$;

alter table public.lfx_business_cards enable row level security;
alter table public.lfx_card_leads enable row level security;
alter table public.lfx_card_events enable row level security;
revoke all on public.lfx_business_cards, public.lfx_card_leads, public.lfx_card_events from public, anon, authenticated;
grant select, insert, update, delete on public.lfx_business_cards, public.lfx_card_leads to service_role;
grant select, insert on public.lfx_card_events to service_role;
revoke all on function public.lfx_record_card_event(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.lfx_record_card_event(uuid, uuid, text, text, text, text) to service_role;

-- Public image bucket for card photos, logos, backgrounds and slides. Uploads are
-- server-validated (JPEG/PNG/WebP magic bytes, 8 MB) and written by the service role only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lfx-card-media', 'lfx-card-media', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

commit;
