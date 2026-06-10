-- ============================================
-- DebugManager - Supabase Schema
-- Supabaseのダッシュボード > SQL Editor で実行してください
-- ============================================

-- プロジェクトテーブル
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz default now() not null
);

-- バグテーブル
create type bug_status   as enum ('open', 'in_progress', 'resolved', 'closed');
create type bug_priority as enum ('low', 'medium', 'high', 'critical');

create table if not exists public.bugs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      bug_status   default 'open'   not null,
  priority    bug_priority default 'medium' not null,
  project_id  uuid references public.projects(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by  uuid references auth.users(id) on delete cascade not null,
  tags        text[]       default '{}',
  created_at  timestamptz  default now() not null,
  updated_at  timestamptz  default now() not null
);

-- コメントテーブル
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  bug_id     uuid references public.bugs(id) on delete cascade not null,
  content    text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- updated_at 自動更新トリガー
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bugs_updated_at
  before update on public.bugs
  for each row execute function public.set_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.projects enable row level security;
alter table public.bugs     enable row level security;
alter table public.comments enable row level security;

-- プロジェクト: ログインユーザー全員が読み書き可能
create policy "projects_select" on public.projects for select to authenticated using (true);
create policy "projects_insert" on public.projects for insert to authenticated with check (auth.uid() = created_by);
create policy "projects_update" on public.projects for update to authenticated using (auth.uid() = created_by);
create policy "projects_delete" on public.projects for delete to authenticated using (auth.uid() = created_by);

-- バグ: ログインユーザー全員が読み書き可能（チーム共有前提）
create policy "bugs_select" on public.bugs for select to authenticated using (true);
create policy "bugs_insert" on public.bugs for insert to authenticated with check (auth.uid() = created_by);
create policy "bugs_update" on public.bugs for update to authenticated using (true);
create policy "bugs_delete" on public.bugs for delete to authenticated using (true);

-- コメント: ログインユーザー全員が読み書き可能、削除は自分のみ
create policy "comments_select" on public.comments for select to authenticated using (true);
create policy "comments_insert" on public.comments for insert to authenticated with check (auth.uid() = created_by);
create policy "comments_delete" on public.comments for delete to authenticated using (auth.uid() = created_by);
