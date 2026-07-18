-- ============================================================
-- MIGRAÇÃO v2 — Portal Acadêmico IFSP
-- Execute no SQL Editor do Supabase (Dashboard → SQL Editor → New query)
-- Este script é seguro para rodar em um banco que já tem o schema.sql aplicado.
-- ============================================================

-- 1. Coluna de e-mail em profiles (necessária para listar alunos no painel admin)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- Atualiza o trigger de criação de usuário para já gravar o e-mail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- 2. Documentos: só o admin pode inserir/editar/excluir; aluno só pode ver os seus
DROP POLICY IF EXISTS "documents_own" ON public.documents;
DROP POLICY IF EXISTS "documents_admin_select" ON public.documents;

CREATE POLICY "documents_select_own" ON public.documents FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "documents_admin_all" ON public.documents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

-- 3. Storage: aluno só visualiza a própria pasta; admin tem acesso total ao bucket
DROP POLICY IF EXISTS "storage_own_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_own_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_own_delete" ON storage.objects;

CREATE POLICY "storage_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "storage_admin_all" ON storage.objects FOR ALL
  USING (bucket_id = 'documentos' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'))
  WITH CHECK (bucket_id = 'documentos' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
