-- Verifica se o bucket existe
SELECT id, name, public FROM storage.buckets WHERE id = 'documentos';

-- Verifica as políticas atuais em documents e storage.objects
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('documents', 'objects', 'profiles', 'boletos')
ORDER BY tablename, policyname;
