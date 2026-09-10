-- REVIEW DRAFT: not applied and not yet generated as a migration by the Supabase CLI.
-- Derived from CTRL+P 015a7b58, initial_schema.sql (coupons).
-- Run only on an explicitly authorized, isolated LayeredFX staging database.
begin;
create table public.lfx_coupons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  code text not null check(code ~ '^[A-Z0-9_-]{1,64}$'),
  description text check(length(description) <= 2000),
  discount_type text not null check(discount_type in ('percentage','fixed')),
  discount_value numeric(10,2) not null check(discount_value > 0 and discount_value <> 'NaN'::numeric),
  min_order_total numeric(10,2) check(min_order_total >= 0 and min_order_total <> 'NaN'::numeric),
  max_uses integer check(max_uses > 0),
  uses_count integer not null default 0 check(uses_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revision bigint not null default 0 check(revision >= 0),
  changed_by uuid not null,
  unique(org_id,code),
  unique(org_id,id),
  foreign key(org_id,changed_by) references public.lfx_ops_members(org_id,user_id),
  check(discount_type <> 'percentage' or discount_value <= 100)
);
create index lfx_coupons_org_created on public.lfx_coupons(org_id,created_at desc,id desc);
alter table public.lfx_coupons enable row level security;
revoke all on public.lfx_coupons from public,anon,authenticated;
grant select,insert,update,delete on public.lfx_coupons to service_role;
-- Used coupons retain their history even if a redemption races a delete request.
create function public.lfx_guard_coupon_delete() returns trigger language plpgsql
security invoker set search_path = '' as $$
begin
  if old.uses_count > 0 then
    raise exception 'Deactivate a used coupon instead of deleting it' using errcode='23503';
  end if;
  return old;
end;
$$;
revoke all on function public.lfx_guard_coupon_delete() from public,anon,authenticated;
create trigger lfx_guard_coupon_delete before delete on public.lfx_coupons
for each row execute function public.lfx_guard_coupon_delete();
-- Order integration must use an organization-qualified FK and atomic redemption
-- transaction that increments revision and uses_count. It is not implemented here.
commit;
