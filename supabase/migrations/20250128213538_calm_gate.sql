-- Habilita a extensão de storage se ainda não estiver habilitada
create extension if not exists "storage" schema "extensions";

-- Cria o bucket logos se não existir
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Política para permitir upload de arquivos por usuários autenticados
create policy "Usuários autenticados podem fazer upload de logos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'logos' and
  (storage.foldername(name))[1] = 'logos'
);

-- Política para permitir visualização pública dos arquivos
create policy "Logos são publicamente visíveis"
on storage.objects for select
to public
using (bucket_id = 'logos');

-- Política para permitir deleção de arquivos por usuários autenticados
create policy "Usuários autenticados podem deletar logos"
on storage.objects for delete
to authenticated
using (bucket_id = 'logos');