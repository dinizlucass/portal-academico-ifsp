-- ============================================================
-- MIGRAÇÃO v3 — Portal Acadêmico IFSP
-- Corrige "infinite recursion detected in policy for relation profiles".
--
-- Causa: as políticas de admin faziam um subquery direto em
-- public.profiles para checar o papel do usuário. Como profiles tem
-- RLS habilitado, essa subquery reaciona as próprias políticas de
-- profiles (inclusive a que também faz subquery em profiles),
-- gerando recursão infinita no Postgres.
--
-- Solução: mover a checagem para uma função SECURITY DEFINER, que
-- roda com privilégio do dono (bypassa RLS) e quebra o ciclo.
--
-- Execute no SQL Editor do Supabase (Dashboard → SQL Editor → New query)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- profiles: admin lê todos os perfis
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT
  USING (public.is_admin());

-- boletos: admin tem CRUD completo
DROP POLICY IF EXISTS "boletos_admin" ON public.boletos;
CREATE POLICY "boletos_admin" ON public.boletos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- documents: admin tem CRUD completo
DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
CREATE POLICY "documents_admin_all" ON public.documents FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- storage: admin tem acesso total ao bucket "documentos"
DROP POLICY IF EXISTS "storage_admin_all" ON storage.objects;
CREATE POLICY "storage_admin_all" ON storage.objects FOR ALL
  USING (bucket_id = 'documentos' AND public.is_admin())
  WITH CHECK (bucket_id = 'documentos' AND public.is_admin());

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
