create table public.transekur_chat_messages (
  service_id uuid not null references public.transekur_services(id) on delete cascade,
  sender text not null check (sender in ('client', 'driver')),
  id uuid not null,
  body text not null check (char_length(body) <= 1000 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default now(),
  primary key (service_id, sender, id)
);

create index transekur_chat_messages_recent_idx
  on public.transekur_chat_messages (service_id, created_at desc, id desc, sender desc);

alter table public.transekur_chat_messages enable row level security;
revoke all on table public.transekur_chat_messages from public, anon, authenticated;
grant select on public.transekur_chat_messages to authenticated;
grant insert (service_id, sender, id, body) on public.transekur_chat_messages to authenticated;

-- The service policy limits driver access to assignments for today in Santo Domingo.
create policy "Assigned driver reads service chat"
  on public.transekur_chat_messages for select to authenticated
  using (exists (
    select 1 from public.transekur_services as service
    join public.transekur_accounts as account on account.id = service.driver_id
    where service.id = transekur_chat_messages.service_id and account.user_id = (select auth.uid())
  ));

create policy "Assigned driver sends as driver"
  on public.transekur_chat_messages for insert to authenticated
  with check (sender = 'driver' and exists (
    select 1 from public.transekur_services as service
    join public.transekur_accounts as account on account.id = service.driver_id
    where service.id = transekur_chat_messages.service_id and account.user_id = (select auth.uid())
  ));

-- The existing client link acts as the credential for this service only.
create function transekur_private.client_portal(p_token text)
returns table (
  client_language text, message text, sent_at timestamptz, driver_name text,
  vehicle text, plate text, chat_messages jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select service.client_language, notice.message, notice.sent_at,
    coalesce(notice.driver_name, driver.name), notice.vehicle, notice.plate,
    coalesce(chat.messages, '[]'::jsonb)
  from public.transekur_services as service
  join public.transekur_accounts as driver on driver.id = service.driver_id
  left join public.transekur_notices as notice on notice.service_id = service.id
  left join lateral (
    select jsonb_agg(to_jsonb(recent) order by created_at, id, sender) as messages
    from (
      select id, sender, body, created_at
      from public.transekur_chat_messages
      where service_id = service.id
      order by created_at desc, id desc, sender desc
      limit 100
    ) as recent
  ) as chat on true
  where p_token ~ '^[0-9a-f]{48}$' and service.client_token = p_token;
$$;

create function public.transekur_client_portal(p_token text)
returns table (
  client_language text, message text, sent_at timestamptz, driver_name text,
  vehicle text, plate text, chat_messages jsonb
)
language sql
stable
set search_path = ''
as $$
  select * from transekur_private.client_portal(p_token);
$$;

create function transekur_private.send_client_chat(p_token text, p_id uuid, p_body text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with eligible as (
    select id from public.transekur_services
    where p_token ~ '^[0-9a-f]{48}$' and client_token = p_token
  ), inserted as (
    insert into public.transekur_chat_messages (service_id, sender, id, body)
    select id, 'client', p_id, btrim(p_body) from eligible
    on conflict (service_id, sender, id) do nothing
  )
  select exists (select 1 from eligible);
$$;

create function public.transekur_send_client_chat(p_token text, p_id uuid, p_body text)
returns boolean
language sql
set search_path = ''
as $$
  select transekur_private.send_client_chat(p_token, p_id, p_body);
$$;

revoke all on function transekur_private.client_portal(text), public.transekur_client_portal(text),
  transekur_private.send_client_chat(text, uuid, text), public.transekur_send_client_chat(text, uuid, text)
  from public, anon, authenticated;
grant execute on function transekur_private.client_portal(text), public.transekur_client_portal(text),
  transekur_private.send_client_chat(text, uuid, text), public.transekur_send_client_chat(text, uuid, text)
  to anon;
