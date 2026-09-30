-- Math Cube Phase 2 Supabase schema
-- Run this in Supabase SQL Editor.
-- Enable Anonymous Sign-Ins in Authentication settings before testing guest cloud save.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  language text not null default 'en',
  golden_apples integer not null default 0 check (golden_apples >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  mode text not null check (mode in ('speed','brain','normal')),
  score integer not null default 0 check (score >= 0),
  best_combo integer not null default 0 check (best_combo >= 0),
  accuracy numeric(6,4) not null default 0 check (accuracy between 0 and 1),
  average_answer_time numeric(8,3) not null default 0 check (average_answer_time >= 0),
  fastest_answer numeric(8,3) not null default 0 check (fastest_answer >= 0),
  highest_level integer not null default 0 check (highest_level >= 0),
  highest_difficulty integer not null default 0 check (highest_difficulty >= 0),
  questions_completed integer not null default 0 check (questions_completed >= 0),
  golden_apples_earned integer not null default 0 check (golden_apples_earned >= 0),
  started_at timestamptz,
  ended_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.speed_records (
  player_id uuid primary key references public.players(id) on delete cascade,
  best_score integer not null default 0,
  best_combo integer not null default 0,
  best_accuracy numeric(6,4) not null default 0,
  fastest_answer numeric(8,3) not null default 0,
  average_answer_time numeric(8,3) not null default 0,
  questions_completed integer not null default 0,
  games_played integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.brain_records (
  player_id uuid primary key references public.players(id) on delete cascade,
  best_score integer not null default 0,
  best_combo integer not null default 0,
  best_accuracy numeric(6,4) not null default 0,
  highest_level integer not null default 0,
  highest_difficulty integer not null default 0,
  questions_completed integer not null default 0,
  games_played integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.golden_apple_transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  amount integer not null,
  reason text not null,
  session_id uuid references public.game_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.game_sessions enable row level security;
alter table public.speed_records enable row level security;
alter table public.brain_records enable row level security;
alter table public.golden_apple_transactions enable row level security;

drop policy if exists players_self on public.players;
create policy players_self on public.players for select using (id = auth.uid());
create policy players_self_update on public.players for update using (id = auth.uid()) with check (id = auth.uid());
create policy players_self_insert on public.players for insert with check (id = auth.uid());

drop policy if exists sessions_self_read on public.game_sessions;
create policy sessions_self_read on public.game_sessions for select using (player_id = auth.uid());

drop policy if exists speed_self_read on public.speed_records;
create policy speed_self_read on public.speed_records for select using (player_id = auth.uid());

drop policy if exists brain_self_read on public.brain_records;
create policy brain_self_read on public.brain_records for select using (player_id = auth.uid());

drop policy if exists transactions_self_read on public.golden_apple_transactions;
create policy transactions_self_read on public.golden_apple_transactions for select using (player_id = auth.uid());

-- The browser must not directly insert game sessions or change the Apple balance.
revoke insert, update, delete on public.game_sessions from anon, authenticated;
revoke insert, update, delete on public.speed_records from anon, authenticated;
revoke insert, update, delete on public.brain_records from anon, authenticated;
revoke insert, update, delete on public.golden_apple_transactions from anon, authenticated;

create or replace function public.submit_game_session(
  mode text,
  score integer,
  best_combo integer,
  accuracy numeric,
  average_answer_time numeric,
  fastest_answer numeric,
  highest_level integer,
  highest_difficulty integer,
  questions_completed integer,
  golden_apples_earned integer default 0,
  started_at timestamptz default null,
  ended_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
  reward integer := 0;
  new_balance integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if mode not in ('speed','brain','normal') then raise exception 'Unsupported game mode'; end if;
  if score < 0 or best_combo < 0 or accuracy < 0 or accuracy > 1 or questions_completed < 0 then
    raise exception 'Invalid session values';
  end if;

  insert into public.players(id) values(uid)
    on conflict (id) do nothing;

  -- The client may report a reward, but the server caps it and bases it on the submitted metrics.
  if mode = 'normal' then
    reward := 1;
  elsif mode = 'speed' then
    reward := least(5, greatest(0, floor(greatest(best_combo - 4,0) / 6)));
  else
    reward := least(5, greatest(0, floor(greatest(highest_difficulty - 2,0) / 2)));
  end if;

  insert into public.game_sessions(
    player_id,mode,score,best_combo,accuracy,average_answer_time,fastest_answer,
    highest_level,highest_difficulty,questions_completed,golden_apples_earned,started_at,ended_at
  ) values (
    uid,mode,score,best_combo,least(1,greatest(0,accuracy)),greatest(0,average_answer_time),greatest(0,fastest_answer),
    greatest(0,highest_level),greatest(0,highest_difficulty),greatest(0,questions_completed),reward,started_at,ended_at
  ) returning id into sid;

  if mode = 'speed' then
    insert into public.speed_records(player_id,best_score,best_combo,best_accuracy,fastest_answer,average_answer_time,questions_completed,games_played)
    values(uid,score,best_combo,accuracy,fastest_answer,average_answer_time,questions_completed,1)
    on conflict(player_id) do update set
      best_score=greatest(public.speed_records.best_score,excluded.best_score),
      best_combo=greatest(public.speed_records.best_combo,excluded.best_combo),
      best_accuracy=greatest(public.speed_records.best_accuracy,excluded.best_accuracy),
      fastest_answer=case when public.speed_records.fastest_answer=0 then excluded.fastest_answer when excluded.fastest_answer=0 then public.speed_records.fastest_answer else least(public.speed_records.fastest_answer,excluded.fastest_answer) end,
      average_answer_time=case when public.speed_records.average_answer_time=0 then excluded.average_answer_time else round(((public.speed_records.average_answer_time*public.speed_records.games_played)+excluded.average_answer_time)/(public.speed_records.games_played+1),3) end,
      questions_completed=public.speed_records.questions_completed+excluded.questions_completed,
      games_played=public.speed_records.games_played+1,
      updated_at=now();
  elsif mode = 'brain' then
    insert into public.brain_records(player_id,best_score,best_combo,best_accuracy,highest_level,highest_difficulty,questions_completed,games_played)
    values(uid,score,best_combo,accuracy,highest_level,highest_difficulty,questions_completed,1)
    on conflict(player_id) do update set
      best_score=greatest(public.brain_records.best_score,excluded.best_score),
      best_combo=greatest(public.brain_records.best_combo,excluded.best_combo),
      best_accuracy=greatest(public.brain_records.best_accuracy,excluded.best_accuracy),
      highest_level=greatest(public.brain_records.highest_level,excluded.highest_level),
      highest_difficulty=greatest(public.brain_records.highest_difficulty,excluded.highest_difficulty),
      questions_completed=public.brain_records.questions_completed+excluded.questions_completed,
      games_played=public.brain_records.games_played+1,
      updated_at=now();
  end if;

  if reward > 0 then
    update public.players set golden_apples=golden_apples+reward,updated_at=now() where id=uid returning golden_apples into new_balance;
    insert into public.golden_apple_transactions(player_id,amount,reason,session_id) values(uid,reward,mode||'_training',sid);
  else
    select golden_apples into new_balance from public.players where id=uid;
  end if;

  return jsonb_build_object('session_id',sid,'golden_apples_earned',reward,'golden_apples',new_balance);
end;
$$;

revoke all on function public.submit_game_session(text,integer,integer,numeric,numeric,numeric,integer,integer,integer,integer,timestamptz,timestamptz) from public;
grant execute on function public.submit_game_session(text,integer,integer,numeric,numeric,numeric,integer,integer,integer,integer,timestamptz,timestamptz) to authenticated;

create table if not exists public.items (
  item_id text primary key,
  name text not null,
  item_type text not null,
  price integer not null check (price >= 0),
  available boolean not null default true
);

create table if not exists public.inventory (
  player_id uuid not null references public.players(id) on delete cascade,
  item_id text not null references public.items(item_id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key(player_id,item_id)
);

alter table public.items enable row level security;
alter table public.inventory enable row level security;
create policy items_public_read on public.items for select to authenticated using (available = true);
create policy inventory_self_read on public.inventory for select using (player_id = auth.uid());
revoke insert, update, delete on public.inventory from anon, authenticated;
grant select on public.items to authenticated;

drop function if exists public.purchase_item(text);
create or replace function public.purchase_item(p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid(); item_price integer; balance integer; item_name text; inserted boolean := false;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select price,name into item_price,item_name from public.items where item_id=p_item_id and available=true;
  if item_price is null then raise exception 'Item unavailable'; end if;
  insert into public.players(id) values(uid) on conflict(id) do nothing;
  if exists(select 1 from public.inventory where player_id=uid and item_id=p_item_id) then
    return jsonb_build_object('purchased',false,'reason','owned','golden_apples',(select golden_apples from public.players where id=uid));
  end if;
  select golden_apples into balance from public.players where id=uid for update;
  if balance < item_price then
    return jsonb_build_object('purchased',false,'reason','insufficient','golden_apples',balance);
  end if;
  update public.players set golden_apples=golden_apples-item_price,updated_at=now() where id=uid returning golden_apples into balance;
  insert into public.inventory(player_id,item_id) values(uid,p_item_id);
  insert into public.golden_apple_transactions(player_id,amount,reason) values(uid,-item_price,'purchase:'||p_item_id);
  return jsonb_build_object('purchased',true,'item_id',p_item_id,'item_name',item_name,'golden_apples',balance);
end;
$$;
revoke all on function public.purchase_item(text) from public;
grant execute on function public.purchase_item(text) to authenticated;

insert into public.items(item_id,name,item_type,price) values
('cyber_cube','Cyber Cube','cube_skin',20),
('blue_flame','Blue Flame','flame_style',30),
('space_bg','Space Background','background',50)
on conflict(item_id) do update set name=excluded.name,item_type=excluded.item_type,price=excluded.price,available=true;


-- Phase 2 achievements / challenges / collection metadata
create table if not exists public.achievements (
  achievement_id text primary key,
  title text not null,
  description text not null,
  reward integer not null default 0 check (reward >= 0),
  available boolean not null default true
);
create table if not exists public.player_achievements (
  player_id uuid not null references public.players(id) on delete cascade,
  achievement_id text not null references public.achievements(achievement_id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key(player_id,achievement_id)
);
create table if not exists public.challenges (
  challenge_id text primary key,
  period text not null check(period in ('daily','weekly')),
  title text not null,
  target integer not null check(target > 0),
  reward integer not null default 0 check(reward >= 0),
  active boolean not null default true
);
create table if not exists public.player_challenges (
  player_id uuid not null references public.players(id) on delete cascade,
  challenge_id text not null references public.challenges(challenge_id) on delete cascade,
  period_key text not null,
  progress integer not null default 0,
  claimed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(player_id,challenge_id,period_key)
);
alter table public.achievements enable row level security;
alter table public.player_achievements enable row level security;
alter table public.challenges enable row level security;
alter table public.player_challenges enable row level security;
drop policy if exists achievements_public_read on public.achievements;
create policy achievements_public_read on public.achievements for select to authenticated using (available=true);
drop policy if exists player_achievements_self_read on public.player_achievements;
create policy player_achievements_self_read on public.player_achievements for select using(player_id=auth.uid());
drop policy if exists challenges_public_read on public.challenges;
create policy challenges_public_read on public.challenges for select to authenticated using(active=true);
drop policy if exists player_challenges_self_read on public.player_challenges;
create policy player_challenges_self_read on public.player_challenges for select using(player_id=auth.uid());
revoke insert, update, delete on public.player_achievements from anon, authenticated;
revoke insert, update, delete on public.player_challenges from anon, authenticated;
grant select on public.achievements,public.challenges to authenticated;

insert into public.achievements(achievement_id,title,description,reward) values
('first-normal','First Level','Clear your first Normal level.',1),
('normal-5','Normal Explorer','Clear 5 Normal levels.',2),
('normal-10','Normal Veteran','Clear 10 Normal levels.',3),
('normal-25','Cube Master','Clear 25 Normal levels.',5),
('speed-combo-10','Combo 10','Reach a 10 combo in Speed Training.',2),
('speed-combo-25','Combo 25','Reach a 25 combo in Speed Training.',4),
('speed-combo-50','Combo 50','Reach a 50 combo in Speed Training.',6),
('brain-diff-5','Deep Thinker','Reach Brain difficulty 5.',2),
('brain-10','Brain Level 10','Reach Brain difficulty 10.',3),
('brain-diff-20','Brain Expert','Reach Brain difficulty 20.',6),
('accuracy-90','Sharp Mind','Finish a training run with 90% accuracy.',2),
('accuracy-95','Precision','Finish a training run with 95% accuracy.',4),
('questions-100','Century','Answer 100 training questions.',3),
('questions-500','Question Hunter','Answer 500 training questions.',5),
('questions-1000','Thousand Answers','Answer 1,000 training questions.',8),
('speed-games-5','Speed Regular','Complete 5 Speed Training runs.',2),
('speed-games-10','Speed Specialist','Complete 10 Speed Training runs.',4),
('brain-games-5','Brain Regular','Complete 5 Brain Training runs.',2),
('brain-games-10','Brain Specialist','Complete 10 Brain Training runs.',4),
('speed-score-5000','Speed 5K','Reach a Speed Training best score of 5,000.',3),
('speed-score-10000','Speed 10K','Reach a Speed Training best score of 10,000.',6),
('brain-score-5000','Brain 5K','Reach a Brain Training best score of 5,000.',3),
('brain-score-10000','Brain 10K','Reach a Brain Training best score of 10,000.',6),
('apples-10','Golden Collector','Hold 10 Golden Apples.',3),
('apples-50','Golden Hoard','Hold 50 Golden Apples.',6),
('apples-100','Golden Vault','Hold 100 Golden Apples.',10),
('speed-fast-3','Three Second Strike','Record a fastest Speed answer of 3 seconds or less.',4),
('speed-avg-5','Rapid Rhythm','Bring Speed Training average answer time to 5 seconds or less.',5),
('brain-level-10','Brain Level 10','Reach Brain level 10.',4),
('brain-level-20','Brain Level 20','Reach Brain level 20.',7)
on conflict(achievement_id) do update set title=excluded.title,description=excluded.description,reward=excluded.reward,available=true;

insert into public.challenges(challenge_id,period,title,target,reward) values
('daily-20','daily','Answer 20 training questions',20,1),
('weekly-100','weekly','Answer 100 training questions',100,5)
on conflict(challenge_id) do update set title=excluded.title,target=excluded.target,reward=excluded.reward,active=true;

insert into public.items(item_id,name,item_type,price) values
('neon_score','Neon Score','score_effect',40),
('future_avatar','Future Avatar','avatar',35),
('pulse_sound','Pulse Sound','sound',25)
on conflict(item_id) do update set name=excluded.name,item_type=excluded.item_type,price=excluded.price,available=true;


drop function if exists public.claim_achievement(text);
create or replace function public.claim_achievement(p_achievement_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); reward integer:=0; bal integer:=0; ok boolean:=false; n numeric; normal_levels numeric; speed_combo numeric; brain_diff numeric; acc numeric; questions numeric; speed_games numeric; brain_games numeric; speed_score numeric; brain_score numeric; speed_fast numeric; speed_avg numeric; brain_level numeric;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select a.reward into reward from public.achievements a where a.achievement_id=p_achievement_id and a.available=true;
 if reward is null then raise exception 'Achievement unavailable'; end if;
 if exists(select 1 from public.player_achievements where player_id=uid and achievement_id=p_achievement_id) then select golden_apples into bal from public.players where id=uid; return jsonb_build_object('claimed',false,'reason','already_claimed','golden_apples',coalesce(bal,0)); end if;
 select coalesce(max(highest_level) filter(where mode='normal'),0),coalesce(max(best_combo) filter(where mode='speed'),0),coalesce(max(highest_difficulty) filter(where mode='brain'),0),coalesce(max(accuracy) filter(where mode in ('speed','brain')),0),coalesce(sum(questions_completed) filter(where mode in ('speed','brain')),0),coalesce(count(*) filter(where mode='speed'),0),coalesce(count(*) filter(where mode='brain'),0),coalesce(max(score) filter(where mode='speed'),0),coalesce(max(score) filter(where mode='brain'),0),coalesce(min(nullif(fastest_answer,0)) filter(where mode='speed'),0),coalesce(avg(average_answer_time) filter(where mode='speed'),0),coalesce(max(highest_level) filter(where mode='brain'),0) into normal_levels,speed_combo,brain_diff,acc,questions,speed_games,brain_games,speed_score,brain_score,speed_fast,speed_avg,brain_level from public.game_sessions where player_id=uid;
 select golden_apples into bal from public.players where id=uid;
 if p_achievement_id='first-normal' then ok:=normal_levels>=1; elsif p_achievement_id='normal-5' then ok:=normal_levels>=5; elsif p_achievement_id='normal-10' then ok:=normal_levels>=10; elsif p_achievement_id='normal-25' then ok:=normal_levels>=25; elsif p_achievement_id='speed-combo-10' then ok:=speed_combo>=10; elsif p_achievement_id='speed-combo-25' then ok:=speed_combo>=25; elsif p_achievement_id='speed-combo-50' then ok:=speed_combo>=50; elsif p_achievement_id='brain-diff-5' then ok:=brain_diff>=5; elsif p_achievement_id='brain-10' then ok:=brain_diff>=10; elsif p_achievement_id='brain-diff-20' then ok:=brain_diff>=20; elsif p_achievement_id='accuracy-90' then ok:=acc>=.9; elsif p_achievement_id='accuracy-95' then ok:=acc>=.95; elsif p_achievement_id='questions-100' then ok:=questions>=100; elsif p_achievement_id='questions-500' then ok:=questions>=500; elsif p_achievement_id='questions-1000' then ok:=questions>=1000; elsif p_achievement_id='speed-games-5' then ok:=speed_games>=5; elsif p_achievement_id='speed-games-10' then ok:=speed_games>=10; elsif p_achievement_id='brain-games-5' then ok:=brain_games>=5; elsif p_achievement_id='brain-games-10' then ok:=brain_games>=10; elsif p_achievement_id='speed-score-5000' then ok:=speed_score>=5000; elsif p_achievement_id='speed-score-10000' then ok:=speed_score>=10000; elsif p_achievement_id='brain-score-5000' then ok:=brain_score>=5000; elsif p_achievement_id='brain-score-10000' then ok:=brain_score>=10000; elsif p_achievement_id='apples-10' then ok:=coalesce(bal,0)>=10; elsif p_achievement_id='apples-50' then ok:=coalesce(bal,0)>=50; elsif p_achievement_id='apples-100' then ok:=coalesce(bal,0)>=100; elsif p_achievement_id='speed-fast-3' then ok:=speed_fast>0 and speed_fast<=3; elsif p_achievement_id='speed-avg-5' then ok:=speed_avg>0 and speed_avg<=5; elsif p_achievement_id='brain-level-10' then ok:=brain_level>=10; elsif p_achievement_id='brain-level-20' then ok:=brain_level>=20; end if;
 if not ok then return jsonb_build_object('claimed',false,'reason','not_unlocked','golden_apples',coalesce(bal,0)); end if;
 insert into public.players(id) values(uid) on conflict(id) do nothing; update public.players set golden_apples=golden_apples+reward,updated_at=now() where id=uid returning golden_apples into bal; insert into public.player_achievements(player_id,achievement_id) values(uid,p_achievement_id); insert into public.golden_apple_transactions(player_id,amount,reason) values(uid,reward,'achievement:'||p_achievement_id); return jsonb_build_object('claimed',true,'achievement_id',p_achievement_id,'golden_apples',bal,'reward',reward);
end; $$;
revoke all on function public.claim_achievement(text) from public; grant execute on function public.claim_achievement(text) to authenticated;

create or replace function public.get_player_achievement_stats()
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); out jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select jsonb_build_object('normal_levels',coalesce(max(highest_level) filter(where mode='normal'),0),'speed_combo',coalesce(max(best_combo) filter(where mode='speed'),0),'brain_difficulty',coalesce(max(highest_difficulty) filter(where mode='brain'),0),'accuracy',coalesce(max(accuracy) filter(where mode in ('speed','brain')),0),'questions',coalesce(sum(questions_completed) filter(where mode in ('speed','brain')),0),'speed_games',coalesce(count(*) filter(where mode='speed'),0),'brain_games',coalesce(count(*) filter(where mode='brain'),0),'speed_score',coalesce(max(score) filter(where mode='speed'),0),'brain_score',coalesce(max(score) filter(where mode='brain'),0),'speed_fastest',coalesce(min(nullif(fastest_answer,0)) filter(where mode='speed'),0),'speed_average',coalesce(avg(average_answer_time) filter(where mode='speed'),0),'brain_level',coalesce(max(highest_level) filter(where mode='brain'),0),'apples',coalesce((select golden_apples from public.players where id=uid),0)) into out from public.game_sessions where player_id=uid;
 return coalesce(out,'{}'::jsonb);
end; $$;
revoke all on function public.get_player_achievement_stats() from public; grant execute on function public.get_player_achievement_stats() to authenticated;

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
