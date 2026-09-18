-- Run once in the Supabase SQL editor. The app uses server-only credentials.
create table if not exists public.shared_entries (
  code text primary key check (code ~ '^[A-Za-z0-9_-]{8}$'),
  kind text not null check (kind in ('blog', 'url')),
  blog jsonb,
  destination text,
  created_at timestamptz not null default now(),
  owner_id uuid references auth.users(id) on delete cascade,
  check (
    (kind = 'blog' and blog is not null and destination is null) or
    (kind = 'url' and blog is null and destination is not null and destination ~ '^https?://')
  )
);
-- Safe to rerun for projects that applied the earlier anonymous-sharing schema.
-- Existing anonymous links stay readable; they are not assigned to an account.
alter table public.shared_entries add column if not exists owner_id uuid references auth.users(id) on delete cascade;
create index if not exists shared_entries_owner_idx on public.shared_entries(owner_id, created_at desc);
alter table public.shared_entries enable row level security;
revoke all on public.shared_entries from anon, authenticated;
revoke all on public.shared_entries from service_role;
grant select, insert on public.shared_entries to service_role;

create table if not exists public.blog_drafts (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  blog jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists blog_drafts_owner_idx on public.blog_drafts(owner_id, updated_at desc);
alter table public.blog_drafts enable row level security;
revoke all on public.blog_drafts from anon, authenticated, service_role;
grant select, insert, update on public.blog_drafts to service_role;

create table if not exists public.share_quotas (
  bucket text primary key,
  window_start timestamptz not null,
  hits integer not null
);
alter table public.share_quotas enable row level security;
revoke all on public.share_quotas from anon, authenticated;

-- Atomic quota shared across server instances: 20 creations per hour-long window.
create or replace function public.consume_share_quota(bucket_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_hits integer;
begin
  delete from public.share_quotas where window_start < now() - interval '2 hours';
  insert into public.share_quotas (bucket, window_start, hits)
  values (bucket_key, now(), 1)
  on conflict (bucket) do update set
    hits = case when share_quotas.window_start < now() - interval '1 hour'
      then 1 else share_quotas.hits + 1 end,
    window_start = case when share_quotas.window_start < now() - interval '1 hour'
      then now() else share_quotas.window_start end
  returning hits into current_hits;
  return current_hits <= 20;
end;
$$;
revoke all on function public.consume_share_quota(text) from public, anon, authenticated;
grant execute on function public.consume_share_quota(text) to service_role;
