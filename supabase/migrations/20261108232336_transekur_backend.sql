create schema transekur_private;
revoke all on schema transekur_private from public;
grant usage on schema transekur_private to anon, authenticated;

create table public.transekur_accounts (
  id text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null,
  name text not null,
  vehicle text,
  plate text,
  constraint transekur_account_kind check (
    (id = 'dispatch' and role = 'dispatch' and vehicle is null and plate is null)
    or (id in ('carlos', 'lucia') and role = 'driver' and vehicle is not null and plate is not null)
  )
);

create table public.transekur_services (
  id uuid primary key default gen_random_uuid(),
  client_name text not null check (char_length(btrim(client_name)) between 1 and 80),
  phone text not null check (char_length(btrim(phone)) between 7 and 28),
  pickup_date date not null,
  pickup_time time(0) without time zone not null check (pickup_time < time '24:00'),
  pickup_point text not null check (char_length(btrim(pickup_point)) between 1 and 180),
  driver_id text not null references public.transekur_accounts(id) check (driver_id in ('carlos', 'lucia')),
  client_token text not null unique default (
    replace(gen_random_uuid()::text, '-', '') || left(replace(gen_random_uuid()::text, '-', ''), 16)
  ),
  created_at timestamptz not null default now()
);

create index transekur_services_driver_day_idx
  on public.transekur_services (driver_id, pickup_date, pickup_time);

create table public.transekur_notices (
  service_id uuid primary key references public.transekur_services(id) on delete cascade,
  driver_name text not null,
  vehicle text not null,
  plate text not null,
  message text not null,
  sent_at timestamptz not null default now()
);

alter table public.transekur_accounts enable row level security;
alter table public.transekur_services enable row level security;
alter table public.transekur_notices enable row level security;

revoke all on table public.transekur_accounts, public.transekur_services, public.transekur_notices
  from public, anon, authenticated;
grant select on public.transekur_accounts, public.transekur_services, public.transekur_notices
  to authenticated;
grant insert (client_name, phone, pickup_date, pickup_time, pickup_point, driver_id)
  on public.transekur_services to authenticated;
grant select, insert, update on public.transekur_accounts to service_role;

create policy "Read own Transekur profile"
  on public.transekur_accounts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Read dispatch board or assigned services today"
  on public.transekur_services for select to authenticated
  using (
    exists (
      select 1
      from public.transekur_accounts as account
      where account.user_id = (select auth.uid())
        and (
          account.role = 'dispatch'
          or (
            account.role = 'driver'
            and account.id = transekur_services.driver_id
            and transekur_services.pickup_date = (select (now() at time zone 'America/Santo_Domingo')::date)
          )
        )
    )
  );

create policy "Dispatch can create services"
  on public.transekur_services for insert to authenticated
  with check (
    exists (
      select 1 from public.transekur_accounts
      where user_id = (select auth.uid()) and role = 'dispatch'
    )
  );

create policy "Read notice for visible service"
  on public.transekur_notices for select to authenticated
  using (
    exists (select 1 from public.transekur_services where id = transekur_notices.service_id)
  );

-- Drivers can send a notice for their own service today. The primary key makes retries idempotent.
create function transekur_private.send_notice(p_service_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with eligible as (
    select service.id, service.client_name, account.name, account.vehicle, account.plate
    from public.transekur_services as service
    join public.transekur_accounts as account on account.id = service.driver_id
    where service.id = p_service_id
      and account.user_id = (select auth.uid())
      and account.role = 'driver'
      and service.pickup_date = (now() at time zone 'America/Santo_Domingo')::date
  ), inserted as (
    insert into public.transekur_notices (service_id, driver_name, vehicle, plate, message)
    select id, name, vehicle, plate,
      format('Hi %s, your driver %s is approximately 10 minutes away in a %s (%s).',
        client_name, name, vehicle, plate)
    from eligible
    on conflict (service_id) do nothing
    returning service_id
  )
  select exists (select 1 from inserted) or exists (select 1 from eligible);
$$;

create function public.transekur_send_notice(p_service_id uuid)
returns boolean
language sql
set search_path = ''
as $$
  select transekur_private.send_notice(p_service_id);
$$;

-- A preview token gives access to one notice and no booking or contact details.
create function transekur_private.client_notice(p_token text)
returns table (message text, sent_at timestamptz, driver_name text, vehicle text, plate text)
language sql
stable
security definer
set search_path = ''
as $$
  select notice.message, notice.sent_at, notice.driver_name, notice.vehicle, notice.plate
  from public.transekur_services as service
  left join public.transekur_notices as notice on notice.service_id = service.id
  where p_token ~ '^[0-9a-f]{48}$' and service.client_token = p_token;
$$;

create function public.transekur_client_notice(p_token text)
returns table (message text, sent_at timestamptz, driver_name text, vehicle text, plate text)
language sql
stable
set search_path = ''
as $$
  select * from transekur_private.client_notice(p_token);
$$;

revoke all on function transekur_private.send_notice(uuid), public.transekur_send_notice(uuid)
  from public, anon, authenticated;
grant execute on function transekur_private.send_notice(uuid), public.transekur_send_notice(uuid)
  to authenticated;

revoke all on function transekur_private.client_notice(text), public.transekur_client_notice(text)
  from public, anon, authenticated;
grant execute on function transekur_private.client_notice(text), public.transekur_client_notice(text)
  to anon;
