import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Cliente principal — mantém sessão do usuário logado
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente isolado — usado para criar novos usuários sem afetar a sessão atual
export const supabaseIsolated = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const supabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;
