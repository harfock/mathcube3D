-- Math Cube v10 migration only. Run after the base schema.sql.
-- ================================================================
-- v10 Player ID + 5 Save Slots
-- Cross-browser guest identity. Player ID is a recovery key, not a
-- security credential; permanent account linking can be added later.
-- ================================================================
create table if not exists public.v10_players (
  player_id text primary key check (player_id ~ '^MC-[A-Z0-9]{6}$'),
  display_name text not null default 'Player',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.v10_save_slots (
  player_id text not null references public.v10_players(player_id) on delete cascade,
  slot_no smallint not null check (slot_no between 1 and 5),
  slot_name text not null default 'Save Slot',
  revision bigint not null default 0,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(player_id,slot_no)
);

alter table public.v10_players enable row level security;
alter table public.v10_save_slots enable row level security;
revoke all on public.v10_players from anon, authenticated;
revoke all on public.v10_save_slots from anon, authenticated;

create or replace function public.v10_create_player(p_player_id text,p_language text default 'en',p_state jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare out jsonb;
begin
  if p_player_id !~ '^MC-[A-Z0-9]{6}$' then raise exception 'Invalid Player ID'; end if;
  insert into public.v10_players(player_id,language) values(p_player_id,coalesce(p_language,'en')) on conflict(player_id) do nothing;
  insert into public.v10_save_slots(player_id,slot_no,slot_name,state) values(p_player_id,1,'Slot 1',coalesce(p_state,'{}'::jsonb)) on conflict(player_id,slot_no) do nothing;
  select jsonb_build_object('player_id',p.player_id,'display_name',p.display_name,'language',p.language,'created_at',p.created_at,
    'slots',coalesce((select jsonb_agg(jsonb_build_object('slot_no',s.slot_no,'slot_name',s.slot_name,'revision',s.revision,'state',s.state,'updated_at',s.updated_at) order by s.slot_no) from public.v10_save_slots s where s.player_id=p.player_id),'[]'::jsonb)) into out
  from public.v10_players p where p.player_id=p_player_id;
  return out;
end $$;

create or replace function public.v10_get_player(p_player_id text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare out jsonb;
begin
  select jsonb_build_object('player_id',p.player_id,'display_name',p.display_name,'language',p.language,'created_at',p.created_at,
    'slots',coalesce((select jsonb_agg(jsonb_build_object('slot_no',s.slot_no,'slot_name',s.slot_name,'revision',s.revision,'state',s.state,'updated_at',s.updated_at) order by s.slot_no) from public.v10_save_slots s where s.player_id=p.player_id),'[]'::jsonb)) into out
  from public.v10_players p where p.player_id=p_player_id;
  return out;
end $$;

create or replace function public.v10_save_slot(p_player_id text,p_slot_no integer,p_slot_name text,p_state jsonb,p_revision bigint)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare current_revision bigint; accepted boolean:=false; final_revision bigint;
begin
  if p_player_id !~ '^MC-[A-Z0-9]{6}$' then raise exception 'Invalid Player ID'; end if;
  if p_slot_no < 1 or p_slot_no > 5 then raise exception 'Invalid save slot'; end if;
  perform 1 from public.v10_players where player_id=p_player_id;
  if not found then raise exception 'Player not found'; end if;
  select revision into current_revision from public.v10_save_slots where player_id=p_player_id and slot_no=p_slot_no;
  if current_revision is null then
    final_revision:=greatest(0,coalesce(p_revision,0));
    insert into public.v10_save_slots(player_id,slot_no,slot_name,revision,state) values(p_player_id,p_slot_no,coalesce(nullif(p_slot_name,''),'Slot '||p_slot_no),final_revision,coalesce(p_state,'{}'::jsonb));
    accepted:=true;
  elsif coalesce(p_revision,0) > current_revision then
    final_revision:=p_revision;
    update public.v10_save_slots set slot_name=coalesce(nullif(p_slot_name,''),slot_name),revision=p_revision,state=coalesce(p_state,'{}'::jsonb),updated_at=now() where player_id=p_player_id and slot_no=p_slot_no;
    accepted:=true;
  else
    final_revision:=current_revision;
  end if;
  update public.v10_players set updated_at=now() where player_id=p_player_id;
  return jsonb_build_object('accepted',accepted,'revision',final_revision);
end $$;

grant execute on function public.v10_create_player(text,text,jsonb) to anon, authenticated;
grant execute on function public.v10_get_player(text) to anon, authenticated;
grant execute on function public.v10_save_slot(text,integer,text,jsonb,bigint) to anon, authenticated;
