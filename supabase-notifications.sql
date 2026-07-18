-- ============================================
-- DebugManager - 通知機能 Schema
-- Supabaseのダッシュボード > SQL Editor で実行してください
-- （supabase-schema.sql の実行後に流すこと）
-- ============================================

-- ============================================
-- テーブル
-- ============================================

create type notification_type as enum ('comment_added', 'status_changed', 'bug_created');

-- 1イベント＝1行。Slack への投稿単位（宛先が何人でも1通）
create table if not exists public.notification_events (
  id         uuid primary key default gen_random_uuid(),
  type       notification_type not null,
  bug_id     uuid references public.bugs(id) on delete cascade,
  actor_id   uuid references auth.users(id) on delete set null,
  title      text not null,
  body       text,
  meta       jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

-- 宛先ごとにファンアウト。アプリ内のベル・未読管理の単位
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.notification_events(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  is_read    boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.notification_events enable row level security;
alter table public.notifications       enable row level security;

-- イベント: ログインユーザー全員が閲覧可能（バグ自体が全員閲覧可なので整合的）
-- insert/update/delete のポリシーは作らない → security definer のトリガー以外は書き込めない
create policy "notification_events_select" on public.notification_events
  for select to authenticated using (true);

-- 通知: 自分宛てのみ閲覧・既読化できる
create policy "notifications_select" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "notifications_update" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- ファンアウト用ヘルパー
-- ============================================

create or replace function public.create_notification(
  p_type       notification_type,
  p_bug_id     uuid,
  p_actor_id   uuid,
  p_title      text,
  p_body       text,
  p_meta       jsonb,
  p_recipients uuid[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  -- 宛先が誰もいなければイベントごと作らない（Slack にも流さない）
  if p_recipients is null or array_length(p_recipients, 1) is null then
    return;
  end if;

  insert into notification_events (type, bug_id, actor_id, title, body, meta)
  values (p_type, p_bug_id, p_actor_id, p_title, p_body, coalesce(p_meta, '{}'::jsonb))
  returning id into v_event_id;

  insert into notifications (event_id, user_id)
  select v_event_id, unnest(p_recipients);
end;
$$;

-- ============================================
-- トリガー
-- ============================================

-- コメント投稿 → バグ作成者 + 担当者 + 過去のコメント投稿者（自分を除く）
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(auth.uid(), new.created_by);
  v_bug   record;
  v_recipients uuid[];
begin
  select id, title, created_by, assigned_to, priority into v_bug
  from bugs where id = new.bug_id;

  if not found then
    return new;
  end if;

  select array_agg(distinct uid) into v_recipients
  from (
    select v_bug.created_by  as uid
    union select v_bug.assigned_to
    union select c.created_by from comments c where c.bug_id = new.bug_id
  ) t
  where uid is not null and uid <> v_actor;

  perform create_notification(
    'comment_added', v_bug.id, v_actor, v_bug.title, new.content,
    jsonb_build_object('priority', v_bug.priority),
    v_recipients
  );

  return new;
end;
$$;

create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ステータス変更 → バグ作成者 + 担当者（自分を除く）
create or replace function public.notify_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(auth.uid(), new.updated_by, new.created_by);
  v_recipients uuid[];
begin
  select array_agg(distinct uid) into v_recipients
  from (
    select new.created_by as uid
    union select new.assigned_to
  ) t
  where uid is not null and uid <> v_actor;

  perform create_notification(
    'status_changed', new.id, v_actor, new.title, null,
    jsonb_build_object(
      'old_status', old.status,
      'new_status', new.status,
      'priority',   new.priority
    ),
    v_recipients
  );

  return new;
end;
$$;

create trigger bugs_status_notify
  after update on public.bugs
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_on_status_change();

-- 新規バグ登録 → 自分以外の全メンバー
create or replace function public.notify_on_bug_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(auth.uid(), new.created_by);
  v_recipients uuid[];
begin
  select array_agg(id) into v_recipients
  from profiles where id <> v_actor;

  perform create_notification(
    'bug_created', new.id, v_actor, new.title, new.description,
    jsonb_build_object('priority', new.priority),
    v_recipients
  );

  return new;
end;
$$;

create trigger bugs_created_notify
  after insert on public.bugs
  for each row execute function public.notify_on_bug_created();

-- ============================================
-- Realtime（アプリ内通知の即時反映用）
-- ============================================

alter publication supabase_realtime add table public.notifications;
