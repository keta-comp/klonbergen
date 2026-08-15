
create or replace function public.is_hall_admin(_user_id uuid, _hall_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.hall_admins where user_id = _user_id and hall_id = _hall_id)
$$;

create table public.wedding_moments (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  image_url text not null,
  storage_path text,
  guest_name text,
  table_number text,
  caption text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert on public.wedding_moments to anon;
grant select, insert, update, delete on public.wedding_moments to authenticated;
grant all on public.wedding_moments to service_role;
alter table public.wedding_moments enable row level security;

create policy "Anyone can view approved moments" on public.wedding_moments
for select to anon, authenticated using (approved = true);
create policy "Admins can view all moments" on public.wedding_moments
for select to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));
create policy "Anyone can upload moments" on public.wedding_moments
for insert to anon, authenticated with check (true);
create policy "Admins can update moments" on public.wedding_moments
for update to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));
create policy "Admins can delete moments" on public.wedding_moments
for delete to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.wedding_halls(id) on delete cascade,
  guest_name text not null,
  phone text,
  guests_count integer not null default 1,
  attending boolean not null default true,
  message text,
  table_number text,
  created_at timestamptz not null default now()
);
grant insert on public.rsvps to anon;
grant select, insert, update, delete on public.rsvps to authenticated;
grant all on public.rsvps to service_role;
alter table public.rsvps enable row level security;

create policy "Anyone can send rsvp" on public.rsvps
for insert to anon, authenticated with check (true);
create policy "Admins can view rsvps" on public.rsvps
for select to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));
create policy "Admins can delete rsvps" on public.rsvps
for delete to authenticated using (public.has_role(auth.uid(),'super_admin') or public.is_hall_admin(auth.uid(), hall_id));

alter table public.wedding_moments replica identity full;
alter publication supabase_realtime add table public.wedding_moments;

create policy "Guests can upload wedding photos" on storage.objects
for insert to anon with check (bucket_id = 'hall-assets' and (storage.foldername(name))[1] = 'weddings');
