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
 *
 *  -- Tabela de trava de edição (apenas 1 dispositivo edita por vez)
 *  create table if not exists edit_locks (
 *    user_id uuid primary key references auth.users(id) on delete cascade,
 *    device_id text not null,
 *    device_name text,
 *    heartbeat timestamptz not null default now()
 *  );
 *  alter table edit_locks enable row level security;
 *  create policy "own lock" on edit_locks
 *    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
 * ─────────────────────────────────────────────────────────────
 */

const HARDCODED_URL = '';
const HARDCODED_KEY = '';

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

/* Identidade única deste dispositivo/navegador */
export function getDeviceId(): string {
  let id = localStorage.getItem('gbr_device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('gbr_device_id', id);
  }
  return id;
}

export function getDeviceName(): string {
  let name = localStorage.getItem('gbr_device_name');
  if (!name) {
    const ua = navigator.userAgent;
    let plat = 'Dispositivo';
    if (/iPhone|iPad/.test(ua)) plat = 'iOS';
    else if (/Android/.test(ua)) plat = 'Android';
    else if (/Mac/.test(ua)) plat = 'Mac';
    else if (/Win/.test(ua)) plat = 'Windows';
    else if (/Linux/.test(ua)) plat = 'Linux';
    name = `${plat} · ${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    localStorage.setItem('gbr_device_name', name);
  }
  return name;
}
