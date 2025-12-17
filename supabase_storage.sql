-- 1. Crear el Bucket "viral-boost-assets" (Público)
insert into storage.buckets (id, name, public)
values ('viral-boost-assets', 'viral-boost-assets', true)
on conflict (id) do nothing;

-- 2. Política: Todo el mundo puede VER las imágenes (Público)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'viral-boost-assets' );

-- 3. Política: Todo el mundo puede SUBIR imágenes (Para la demo)
-- En producción restringiríamos esto a usuarios autenticados: auth.role() = 'authenticated'
create policy "Allow Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'viral-boost-assets' );
