-- Applied to LayeredFX Supabase (tdywcdgbavfcsywejoka) as layeredfx_bookings.
-- Public appointment bookings (guest-created, shown in /admin/bookings and matched to portal accounts by
-- confirmed email) and their email notification log. Server-only access through the service role.
create table public.lfx_bookings (
  id uuid primary key,
  org_id uuid not null,
  appointment_type text not null check (appointment_type ~ '^[a-z0-9-]{1,60}$'),
  title text not null check (length(title) between 1 and 180),
  location_type text not null check (location_type in ('phone_call','video_meeting','in_person','onsite_installation','custom_location')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text not null default 'America/Phoenix' check (length(timezone) <= 60),
  status text not null default 'pending' check (status in ('pending','confirmed','rescheduled','canceled','completed','no_show','follow_up_needed','awaiting_payment','awaiting_deposit','awaiting_customer_info','awaiting_approval')),
  customer_first_name text not null check (length(customer_first_name) between 1 and 75),
  customer_last_name text not null default '' check (length(customer_last_name) <= 75),
  customer_email text not null check (customer_email = lower(customer_email) and length(customer_email) between 3 and 254),
  customer_phone text not null default '' check (length(customer_phone) <= 40),
  company_name text not null default '' check (length(company_name) <= 200),
  customer_notes text not null default '' check (length(customer_notes) <= 3000),
  internal_notes text not null default '' check (length(internal_notes) <= 5000),
  assigned_staff_id uuid,
  source text not null default 'public_booking' check (source in ('public_booking','portal','dashboard')),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array' and pg_column_size(history) <= 100000),
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (org_id, id),
  foreign key (org_id, assigned_staff_id) references public.lfx_ops_members(org_id, user_id)
);
create index lfx_bookings_org_start on public.lfx_bookings(org_id, start_time);
create index lfx_bookings_org_email on public.lfx_bookings(org_id, customer_email);
create index lfx_bookings_assigned on public.lfx_bookings(org_id, assigned_staff_id);

create table public.lfx_booking_notifications (
  id bigint generated always as identity primary key,
  org_id uuid not null,
  booking_id uuid not null,
  channel text not null default 'email' check (channel in ('email')),
  notification_type text not null check (notification_type in ('confirmation','updated','cancelled','team_alert')),
  recipient text not null check (length(recipient) <= 254),
  status text not null check (status in ('sent','failed','skipped')),
  error_message text check (length(error_message) <= 500),
  created_at timestamptz not null default now(),
  foreign key (org_id, booking_id) references public.lfx_bookings(org_id, id) on delete cascade
);
create index lfx_booking_notifications_booking on public.lfx_booking_notifications(org_id, booking_id, created_at desc);
create index lfx_booking_notifications_recent on public.lfx_booking_notifications(org_id, created_at desc);

alter table public.lfx_bookings enable row level security;
alter table public.lfx_booking_notifications enable row level security;
revoke all on public.lfx_bookings, public.lfx_booking_notifications from public, anon, authenticated;
grant select, insert, update, delete on public.lfx_bookings to service_role;
grant select, insert on public.lfx_booking_notifications to service_role;
