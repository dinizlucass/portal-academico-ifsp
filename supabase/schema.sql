-- ============================================================
-- PORTAL ACADÊMICO IFSP — Schema Supabase
-- Execute este script no SQL Editor do Supabase:
--   Supabase Dashboard → SQL Editor → New query → Cole e execute
-- ============================================================

-- ============================================================
-- 1. PERFIS DE USUÁRIO
--    Estende a tabela auth.users do Supabase Auth.
--    Um registro é criado automaticamente via trigger no signup.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  email       TEXT,
  role        TEXT        NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
  registration TEXT,          -- matrícula ex: SP260001
  cpf         TEXT,
  birth_date  DATE,
  phone       TEXT,
  avatar_url  TEXT,
  course_id   TEXT,
  current_semester INT DEFAULT 1,
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'graduated')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: cria perfil automaticamente ao criar usuário no Auth
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. BOLETOS FINANCEIROS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.boletos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  value       NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date    DATE        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. DOCUMENTOS DO ALUNO
--    Metadados dos arquivos; o arquivo em si fica no Storage.
--    Bucket: "documentos" (criar manualmente no Supabase Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('carteirinha', 'historico', 'declaracao', 'outros')),
  name         TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,   -- caminho no bucket Storage
  file_size    BIGINT,
  mime_type    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. CONFIGURAÇÕES DO ALUNO
--    Uma linha por aluno, criada via upsert.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  student_id            UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notify_boletos        BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_grades         BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_announcements  BOOLEAN     NOT NULL DEFAULT TRUE,
  email_digest          BOOLEAN     NOT NULL DEFAULT FALSE,
  language              TEXT        NOT NULL DEFAULT 'pt-BR',
  accessibility_font    BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. RLS (Row Level Security)
--    Cada aluno só vê/edita os seus próprios dados.
--    Admins têm acesso total (ajuste a política conforme necessário).
-- ============================================================
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings  ENABLE ROW LEVEL SECURITY;

-- Função auxiliar SECURITY DEFINER: checa se o usuário logado é admin.
-- Necessária porque uma policy de profiles não pode fazer subquery direto
-- em profiles (RLS reaciona a própria policy e causa recursão infinita).
-- Rodando como SECURITY DEFINER, a consulta interna bypassa RLS.
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

-- Profiles: usuário lê e atualiza o próprio; admin lê todos
CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Boletos: aluno vê os seus; admin tem CRUD completo
CREATE POLICY "boletos_own"   ON public.boletos FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "boletos_admin" ON public.boletos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Documents: aluno só visualiza os seus; admin tem controle total (upload/edição/exclusão)
CREATE POLICY "documents_select_own" ON public.documents FOR SELECT
  USING (student_id = auth.uid());
CREATE POLICY "documents_admin_all" ON public.documents FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Settings: aluno crud no seu registro
CREATE POLICY "settings_own" ON public.settings FOR ALL USING (student_id = auth.uid());

-- ============================================================
-- 6. DADOS INICIAIS — USUÁRIO ADMIN
--
--    PASSO 1: Crie o usuário no Supabase Auth:
--      Dashboard → Authentication → Users → Add user
--      Email:  admin@ifsp.edu.br
--      Senha:  Admin@IFSP2026   (troque após o primeiro login)
--
--    PASSO 2: Após criar o usuário, copie o UUID gerado e
--    execute o UPDATE abaixo substituindo <UUID_DO_ADMIN>:
--
-- UPDATE public.profiles
-- SET name = 'Administrador IFSP', role = 'ADMIN'
-- WHERE id = '<UUID_DO_ADMIN>';
--
--    PASSO 3: Para criar alunos, use o mesmo fluxo:
--      Dashboard → Authentication → Users → Add user
--      ou chame a função admin no seu backend:
--
-- SELECT auth.admin_create_user(
--   email      := 'aluno@ifsp.edu.br',
--   password   := 'Aluno@IFSP2026',
--   user_metadata := '{"name": "Lucas Diniz", "role": "STUDENT"}'
-- );
--
-- ============================================================

-- ============================================================
-- 7. BUCKET STORAGE para documentos
--    Execute no SQL Editor do Supabase:
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Política Storage: aluno só visualiza/baixa a própria pasta; admin tem acesso total ao bucket
CREATE POLICY "storage_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "storage_admin_all" ON storage.objects FOR ALL
  USING (bucket_id = 'documentos' AND public.is_admin())
  WITH CHECK (bucket_id = 'documentos' AND public.is_admin());

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
