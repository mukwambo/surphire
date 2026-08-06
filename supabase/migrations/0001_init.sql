-- BarberBook MVP schema
-- Maps to Section 3 (Database Architecture) of the product blueprint.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type user_role as enum ('owner', 'barber');
create type shop_status as enum ('active', 'inactive');
create type service_status as enum ('active', 'inactive');
create type barber_status as enum ('active', 'inactive');
create type booking_status as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
create type notification_type as enum (
  'booking_created', 'booking_confirmed', 'booking_cancelled',
  'booking_reminder', 'booking_completed'
);
create type notification_status as enum ('pending', 'sent', 'failed');
create type notification_recipient as enum ('customer', 'staff');

-- profiles mirrors auth.users for app-level fields (doc's "users" entity).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  role user_role not null default 'owner',
  created_at timestamptz not null default now()
);

create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete restrict,
  name text not null,
  slug text not null unique,
  phone text,
  location text,
  timezone text not null default 'Africa/Nairobi',
  status shop_status not null default 'active',
  created_at timestamptz not null default now()
);

create index shops_owner_id_idx on shops (owner_id);

create table barbers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  display_name text not null,
  status barber_status not null default 'active',
  created_at timestamptz not null default now()
);

create index barbers_shop_id_idx on barbers (shop_id);
create index barbers_user_id_idx on barbers (user_id);

create table services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  duration_minutes integer not null check (duration_minutes > 0),
  status service_status not null default 'active',
  created_at timestamptz not null default now()
);

create index services_shop_id_idx on services (shop_id);

create table working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time time not null,
  close_time time not null,
  check (close_time > open_time),
  unique (barber_id, day_of_week)
);

create table blocked_times (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

create index blocked_times_barber_id_idx on blocked_times (barber_id, starts_at);

create table customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);

create index customers_shop_id_idx on customers (shop_id);
create index customers_shop_phone_idx on customers (shop_id, phone);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  shop_id uuid not null references shops (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete restrict,
  barber_id uuid not null references barbers (id) on delete restrict,
  service_id uuid not null references services (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status booking_status not null default 'PENDING',
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- A barber cannot have overlapping active bookings (PENDING/CONFIRMED).
  -- This is the last line of defense against the double-booking race
  -- condition described in Section 7 -- enforced at the DB level, not just
  -- checked in application code before the insert.
  exclude using gist (
    barber_id with =,
    tsrange(starts_at, ends_at) with &&
  ) where (status in ('PENDING', 'CONFIRMED'))
);

create index bookings_barber_starts_idx on bookings (barber_id, starts_at);
create index bookings_shop_starts_idx on bookings (shop_id, starts_at);
create index bookings_reference_idx on bookings (reference);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  recipient notification_recipient not null,
  type notification_type not null,
  status notification_status not null default 'pending',
  sent_at timestamptz
);

create index notifications_booking_id_idx on notifications (booking_id);

-- Helper: is the current auth user staff (owner or linked barber) of a shop?
create or replace function is_shop_staff(target_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from shops s
    where s.id = target_shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from barbers b
    where b.shop_id = target_shop_id and b.user_id = auth.uid()
  );
$$;

alter table profiles enable row level security;
alter table shops enable row level security;
alter table barbers enable row level security;
alter table services enable row level security;
alter table working_hours enable row level security;
alter table blocked_times enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table notifications enable row level security;

-- profiles: a user can read/update their own profile.
create policy "profiles_self_select" on profiles for select using (id = auth.uid());
create policy "profiles_self_update" on profiles for update using (id = auth.uid());
create policy "profiles_self_insert" on profiles for insert with check (id = auth.uid());

-- shops: anyone can read active shops (public booking page); staff can read/update their own.
create policy "shops_public_select" on shops for select using (status = 'active');
create policy "shops_staff_select" on shops for select using (is_shop_staff(id));
create policy "shops_owner_all" on shops for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- barbers/services/working_hours: public can read active rows for booking flow.
create policy "barbers_public_select" on barbers for select using (status = 'active');
create policy "barbers_staff_all" on barbers for all using (is_shop_staff(shop_id)) with check (is_shop_staff(shop_id));

create policy "services_public_select" on services for select using (status = 'active');
create policy "services_staff_all" on services for all using (is_shop_staff(shop_id)) with check (is_shop_staff(shop_id));

create policy "working_hours_public_select" on working_hours for select using (true);
create policy "working_hours_staff_all" on working_hours for all using (
  is_shop_staff((select shop_id from barbers where barbers.id = working_hours.barber_id))
) with check (
  is_shop_staff((select shop_id from barbers where barbers.id = working_hours.barber_id))
);

create policy "blocked_times_public_select" on blocked_times for select using (true);
create policy "blocked_times_staff_all" on blocked_times for all using (
  is_shop_staff((select shop_id from barbers where barbers.id = blocked_times.barber_id))
) with check (
  is_shop_staff((select shop_id from barbers where barbers.id = blocked_times.barber_id))
);

-- customers/bookings: staff can read/manage their shop's data.
-- Public booking creation goes through the server (service role key), which
-- bypasses RLS -- the API route is responsible for enforcing the availability
-- re-check inside a transaction before insert.
create policy "customers_staff_all" on customers for all using (is_shop_staff(shop_id)) with check (is_shop_staff(shop_id));
create policy "bookings_staff_all" on bookings for all using (is_shop_staff(shop_id)) with check (is_shop_staff(shop_id));
create policy "notifications_staff_select" on notifications for select using (
  is_shop_staff((select shop_id from bookings where bookings.id = notifications.booking_id))
);
