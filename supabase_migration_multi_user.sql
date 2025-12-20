
-- 1. Enable RLS on all tables (if not already)
alter table posts enable row level security;
alter table products enable row level security;
alter table inbox_messages enable row level security;

-- 2. Create User Settings Table
create table public.user_settings (
  user_id uuid references auth.users not null primary key,
  gemini_api_key text,
  meta_app_id text,
  meta_app_secret text, 
  meta_access_token text,
  meta_page_id text,
  meta_page_name text,
  meta_page_access_token text,
  meta_instagram_id text,
  tiktok_client_key text,
  tiktok_client_secret text,
  ai_knowledge_base text,
  brand_voice_presets jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings" 
on public.user_settings for select 
using (auth.uid() = user_id);

create policy "Users can update their own settings" 
on public.user_settings for update 
using (auth.uid() = user_id);

create policy "Users can insert their own settings" 
on public.user_settings for insert 
with check (auth.uid() = user_id);

-- 3. Add user_id to existing tables
alter table posts add column user_id uuid references auth.users default auth.uid();
alter table products add column user_id uuid references auth.users default auth.uid();
alter table inbox_messages add column user_id uuid references auth.users default auth.uid();

-- 4. Update Policies for Posts
drop policy if exists "Allow all access" on posts;
create policy "Users can view own posts" on posts for select using (auth.uid() = user_id);
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

-- 5. Update Policies for Products
drop policy if exists "Allow all access" on products;
create policy "Users can view own products" on products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on products for delete using (auth.uid() = user_id);

-- 6. Update Policies for Messages
drop policy if exists "Allow all access" on inbox_messages;
create policy "Users can view own messages" on inbox_messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on inbox_messages for insert with check (auth.uid() = user_id);
create policy "Users can update own messages" on inbox_messages for update using (auth.uid() = user_id);

-- 7. Trigger to create user_settings on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
