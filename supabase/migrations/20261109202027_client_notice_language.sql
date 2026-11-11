alter table public.transekur_services
  add column client_language text not null default 'es'
  check (client_language in ('es', 'en'));

-- Notices sent before this migration were written in English.
update public.transekur_services as service
set client_language = 'en'
where exists (
  select 1 from public.transekur_notices as notice where notice.service_id = service.id
);

grant insert (client_language) on public.transekur_services to authenticated;

alter table public.transekur_accounts add column vehicle_es text;

update public.transekur_accounts as account
set vehicle_es = translation.vehicle_es
from (values
  ('carlos', 'Black Toyota Camry', 'Toyota Camry negro'),
  ('lucia', 'White Hyundai Staria', 'Hyundai Staria blanco')
) as translation(id, vehicle, vehicle_es)
where account.id = translation.id and account.vehicle = translation.vehicle;

create or replace function transekur_private.send_notice(p_service_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with eligible as (
    select service.id, service.client_name, service.client_language,
      account.name, account.vehicle, account.vehicle_es, account.plate
    from public.transekur_services as service
    join public.transekur_accounts as account on account.id = service.driver_id
    where service.id = p_service_id
      and account.user_id = (select auth.uid())
      and account.role = 'driver'
      and service.pickup_date = (now() at time zone 'America/Santo_Domingo')::date
  ), inserted as (
    insert into public.transekur_notices (service_id, driver_name, vehicle, plate, message)
    select id, name, vehicle, plate,
      case client_language
        when 'en' then
          format('Hi %s, your driver %s is approximately 10 minutes away in a %s (%s).',
            client_name, name, vehicle, plate)
        else
          format('Hola %s, su conductor %s llegará en unos 10 minutos. Viaja en un %s con placa %s.',
            client_name, name, coalesce(vehicle_es, vehicle), plate)
      end
    from eligible
    on conflict (service_id) do nothing
    returning service_id
  )
  select exists (select 1 from inserted) or exists (select 1 from eligible);
$$;
