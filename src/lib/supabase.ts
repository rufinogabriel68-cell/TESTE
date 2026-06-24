import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURAÇÃO DO SUPABASE
 * ─────────────────────────────────────────────────────────────
 *  Preencha suas credenciais abaixo (Project Settings → API).
 *  Ou configure em tempo de execução pela tela de Configurações
 *  (salvo em localStorage).
 *
 *  ── SQL para criar as tabelas no Supabase (SQL Editor) ──
 *
 *  -- Tabela com o blob de dados do workspace (1 linha por usuário)
 *  create table if not exists workspaces (
 *    user_id uuid primary key references auth.users(id) on delete cascade,
 *    data jsonb not null default '{}',
 *    updated_at timestamptz not null default now()
 *  );
 *  alter table workspaces enable row level security;
 *  create policy "own workspace" on workspaces
 *    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
 * ─────────────────────────────────────────────────────────────
 */

const HARDCODED_URL = 'https://uzscbvmahqbbetktcrca.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6c2Nidm1haHFiYmV0a3RjcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDkwMzYsImV4cCI6MjA5NzgyNTAzNn0.OZiqukS5f_tuZZ-TLP5xw41ySC_gHtR7dO6ZNXUEa8w';

export function getStoredCreds(): { url: string; key: string } {
  let url = HARDCODED_URL;
  let key = HARDCODED_KEY;
  try {
    const raw = localStorage.getItem('gbr_supabase_creds');
    if (raw) {
      const c = JSON.parse(raw);
      url = c.url || url;
      key = c.key || key;
    }
  } catch { /* ignore */ }
  return { url, key };
}

export function setStoredCreds(url: string, key: string) {
  localStorage.setItem('gbr_supabase_creds', JSON.stringify({ url, key }));
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getStoredCreds();
  if (!url || !key) return null;
  if (_client) return _client;
  try {
    _client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return _client;
  } catch {
    return null;
  }
}

export function resetSupabase() {
  _client = null;
}
