-- ============================================================================
-- Vowly Super Admin — billing & management system
-- ============================================================================
-- Adds: plans, subscriptions, payments, notifications, activity_logs
-- Adds: cover_url + archived + trial columns to wedding_halls
-- Deduplicated: notifications are uniquely identified by (hall_id, type, day)
-- so 5/3/1-day reminders are never created twice.
-- All times are computed in Asia/Tashkent via SQL helpers.
-- ============================================================================

-- 1. plans — subscription plan templates ======================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- 'venue' | 'invitation' | 'venue_invitation'
  name text not null,                        -- 'Venue', 'Invitation', 'Venue + Invitation'
  price numeric(12, 2) not null default 0,  -- monthly price in UZS
  period_days integer not null default 30,   -- subscription period
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;

-- seed default plans
insert into public.plans (code, name, price, period_days, display_order, description) values
  ('venue',             'Venue',              99000,   30, 1, 'Faqat toʼyxona boshqaruvi'),
  ('invitation',        'Invitation',        299000,   30, 2, 'Faqat raqamli taklifnoma'),
  ('venue_invitation',  'Venue + Invitation',399000,   30, 3, 'Toʼyxona va taklifnoma birgalikda')
on conflict (code) do nothing;

-- 2. extend wedding_halls =====================================================
alter table public.wedding_halls
  add column if not exists cover_url text,
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

-- 3. subscriptions ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active','trial','expired','blocked','archived')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_hall_id_idx on public.subscriptions(hall_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_expires_at_idx on public.subscriptions(expires_at);
alter table public.subscriptions enable row level security;

-- trigger to keep updated_at fresh
create or replace function public.subscriptions_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.subscriptions_touch_updated_at();

-- Only one ACTIVE/TRIAL subscription per hall at a time
create unique index if not exists subscriptions_one_active_per_hall
  on public.subscriptions(hall_id)
  where status in ('active','trial');

-- 4. payments =================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'UZS',
  period_start timestamptz not null,
  period_end timestamptz not null,
  paid_at timestamptz not null default now(),
  status text not null default 'paid' check (status in ('paid','pending','failed','refunded')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists payments_hall_id_idx on public.payments(hall_id);
create index if not exists payments_paid_at_idx on public.payments(paid_at desc);
alter table public.payments enable row level security;

-- 5. notifications ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid references public.wedding_halls(id) on delete cascade,
  type text not null,                       -- 'sub_5d' | 'sub_3d' | 'sub_1d' | 'sub_today' | 'trial_ending' | 'info' | 'payment'
  title text not null,
  message text not null,
  link text,                                -- e.g. '/super-admin/halls/<id>'
  read_at timestamptz,
  dedup_key text,                           -- (hall_id + type + day) — prevents duplicates
  created_at timestamptz not null default now()
);
create index if not exists notifications_hall_id_idx on public.notifications(hall_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists notifications_read_at_idx on public.notifications(read_at);
create unique index if not exists notifications_dedup_key_unique
  on public.notifications(dedup_key) where dedup_key is not null;
alter table public.notifications enable row level security;

-- 6. activity logs ============================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  hall_id uuid references public.wedding_halls(id) on delete set null,
  action text not null,                     -- 'hall_created' | 'hall_archived' | 'admin_created' | 'plan_changed' | 'payment_confirmed' | ...
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index if not exists activity_logs_hall_id_idx on public.activity_logs(hall_id);
alter table public.activity_logs enable row level security;

-- 7. Helper: Tashkent "today" date (00:00 Asia/Tashkent)
create or replace function public.today_in_tashkent()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Tashkent')::date
$$;

-- Helper: days remaining (positive = days left, negative = days overdue)
create or replace function public.subscription_days_remaining(_expires_at timestamptz)
returns integer language sql stable as $$
  select ((_expires_at at time zone 'Asia/Tashkent')::date - public.today_in_tashkent())
$$;

-- 8. RPC — confirm payment ====================================================
-- Creates a new subscription period and a payment record atomically.
-- Returns the new payment id.
create or replace function public.confirm_subscription_payment(
  _hall_id uuid,
  _plan_id uuid,
  _paid_at timestamptz default now(),
  _note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan record;
  v_new_sub_id uuid;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_payment_id uuid;
  v_actor uuid := auth.uid();
  v_actor_email text;
begin
  -- load plan
  select * into v_plan from public.plans where id = _plan_id and is_active = true;
  if v_plan.id is null then
    raise exception 'Plan not found or inactive';
  end if;

  -- expire current active subscription
  update public.subscriptions
     set status = 'archived'
   where hall_id = _hall_id
     and status in ('active','trial','expired');

  -- create new subscription starting today
  v_period_start := _paid_at;
  v_period_end := v_period_start + (v_plan.period_days || ' days')::interval;

  insert into public.subscriptions (hall_id, plan_id, status, started_at, expires_at, auto_renew)
  values (_hall_id, _plan_id, 'active', v_period_start, v_period_end, false)
  returning id into v_new_sub_id;

  -- record payment
  insert into public.payments (hall_id, subscription_id, plan_id, amount, period_start, period_end, paid_at, status, note, created_by)
  values (_hall_id, v_new_sub_id, _plan_id, v_plan.price, v_period_start, v_period_end, v_period_start, 'paid', _note, v_actor)
  returning id into v_payment_id;

  -- resolve actor email for activity log
  select email into v_actor_email from auth.users where id = v_actor;

  insert into public.activity_logs (actor_id, actor_email, hall_id, action, description, metadata)
  values (
    v_actor, v_actor_email, _hall_id, 'payment_confirmed',
    format('Toʼlov qabul qilindi: %s soʼm', v_plan.price::text),
    jsonb_build_object('plan_id', _plan_id, 'plan_code', v_plan.code, 'amount', v_plan.price, 'subscription_id', v_new_sub_id, 'payment_id', v_payment_id)
  );

  -- clear any pending sub_* notifications for this hall
  update public.notifications
     set read_at = now()
   where hall_id = _hall_id
     and type like 'sub_%'
     and read_at is null;

  return v_payment_id;
end $$;

-- 9. RPC — generate subscription reminder notifications =======================
-- Idempotent: deduplicated via notifications.dedup_key (one row per hall/type/date).
-- Call this when the super-admin dashboard loads (or as a scheduled Edge Function).
create or replace function public.sync_subscription_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.today_in_tashkent();
  v_actor uuid := auth.uid();
  v_inserted integer := 0;
  v_rec record;
  v_days_left integer;
  v_type text;
  v_title text;
  v_message text;
  v_dedup text;
begin
  for v_rec in
    select s.id as sub_id, s.hall_id, s.expires_at, h.name as hall_name
    from public.subscriptions s
    join public.wedding_halls h on h.id = s.hall_id
    where s.status in ('active','trial','expired')
      and h.archived = false
  loop
    v_days_left := public.subscription_days_remaining(v_rec.expires_at);

    if v_days_left = 5 then
      v_type := 'sub_5d';
      v_title := v_rec.hall_name;
      v_message := 'Oylik toʼlovingiz tugashiga 5 kun qoldi.';
    elsif v_days_left = 3 then
      v_type := 'sub_3d';
      v_title := v_rec.hall_name;
      v_message := 'Oylik toʼlov tugashiga 3 kun qoldi.';
    elsif v_days_left = 1 then
      v_type := 'sub_1d';
      v_title := v_rec.hall_name;
      v_message := 'Oylik toʼlov ertaga tugaydi.';
    elsif v_days_left = 0 then
      v_type := 'sub_today';
      v_title := v_rec.hall_name;
      v_message := 'Oylik abonement bugun tugaydi.';
    elsif v_days_left < 0 then
      v_type := 'sub_expired';
      v_title := v_rec.hall_name;
      v_message := format('Oylik abonement muddati tugagan (%s kun avval).', abs(v_days_left));
    else
      continue;
    end if;

    v_dedup := v_rec.hall_id || ':' || v_type || ':' || v_today::text;

    insert into public.notifications (hall_id, type, title, message, link, dedup_key)
    values (
      v_rec.hall_id, v_type, v_title, v_message,
      '/super-admin/halls/' || v_rec.hall_id::text,
      v_dedup
    )
    on conflict (dedup_key) do nothing
    returning 1 into v_inserted;
  end loop;

  -- auto-archive expired subscriptions
  update public.subscriptions
     set status = 'expired'
   where status in ('active','trial')
     and expires_at < (v_today::timestamp at time zone 'Asia/Tashkent');

  return v_inserted;
end $$;

-- 10. RLS policies ============================================================
-- helper
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'super_admin')
$$;

-- plans: everyone can read, only super_admin can write
create policy "Anyone can read plans" on public.plans for select using (true);
create policy "Super admin manages plans" on public.plans
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- subscriptions: super admin full access, hall admin can read their own
create policy "Super admin manages subscriptions" on public.subscriptions
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Hall admin reads own subscription" on public.subscriptions
  for select to authenticated using (public.is_hall_admin(auth.uid(), hall_id));

-- payments: super admin full access, hall admin can read their own
create policy "Super admin manages payments" on public.payments
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Hall admin reads own payments" on public.payments
  for select to authenticated using (public.is_hall_admin(auth.uid(), hall_id));

-- notifications: super admin full access, hall admin can read their own
create policy "Super admin manages notifications" on public.notifications
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Hall admin reads own notifications" on public.notifications
  for select to authenticated using (public.is_hall_admin(auth.uid(), hall_id));

-- activity logs: super admin only
create policy "Super admin reads activity logs" on public.activity_logs
  for select to authenticated using (public.is_super_admin());
create policy "Super admin writes activity logs" on public.activity_logs
  for insert to authenticated with check (public.is_super_admin());
