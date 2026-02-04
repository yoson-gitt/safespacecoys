-- Supabase RLS starter policies (adjust to your schema)
-- Tables assumed: mood_entries, posts

-- Enable RLS
alter table public.mood_entries enable row level security;
alter table public.posts enable row level security;

-- Allow authenticated users to read their own mood entries
create policy "read_own_mood_entries"
    on public.mood_entries for select
    to authenticated
    using (auth.uid() = user_id);

-- Allow authenticated users to insert their own mood entries
create policy "insert_own_mood_entries"
    on public.mood_entries for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Allow authenticated users to read posts (community feed)
create policy "read_posts"
    on public.posts for select
    to authenticated
    using (true);

-- Allow authenticated users to insert their own posts
create policy "insert_own_posts"
    on public.posts for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Optional: block updates/deletes unless you explicitly need them
-- create policy "update_own_posts" on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "delete_own_posts" on public.posts for delete to authenticated using (auth.uid() = user_id);
