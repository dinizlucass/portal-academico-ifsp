import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Cliente principal — mantém sessão do usuário logado.
// storageKey própria para não cruzar sessão com o cliente isolado abaixo
// (por padrão os dois usariam a mesma chave e sincronizariam sessão entre si
// via BroadcastChannel, fazendo o cliente principal "virar" o usuário recém-criado).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: 'sb-portal-main-auth' },
});

// Cliente isolado — usado para criar novos usuários sem afetar a sessão do admin
export const supabaseIsolated = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-portal-isolated-auth' },
});

export const supabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;
