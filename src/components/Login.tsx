import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getStoredCreds, setStoredCreds } from '../lib/supabase';

export default function Login({ supabase, hasSupabase }: { supabase: SupabaseClient | null; hasSupabase: boolean }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const stored = getStoredCreds();
  const [showCfg, setShowCfg] = useState(!hasSupabase);
  const [url, setUrl] = useState(stored.url);
  const [key, setKey] = useState(stored.key);

  const salvarCreds = () => {
    if (!url.trim() || !key.trim()) { setErr('// preencha URL e chave do Supabase'); return; }
    setStoredCreds(url.trim(), key.trim());
    window.location.reload();
  };

  const traduz = (m: string) => {
    if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/already registered/i.test(m)) return 'E-mail já cadastrado. Use sua senha.';
    if (/Password should/i.test(m)) return 'Senha fraca (mín. 6 caracteres).';
    if (/network/i.test(m)) return 'Sem conexão com a internet.';
    return m;
  };

  const login = async () => {
    setErr('');
    if (!email || !pass) { setErr('// preencha e-mail e senha'); return; }
    if (!supabase || !hasSupabase) {
      setErr('// Supabase não configurado. Configure nas Configurações ou use sem login (recarregue).');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (error) {
      // tenta criar conta
      const { error: e2 } = await supabase.auth.signUp({ email: email.trim(), password: pass });
      if (e2) setErr('// ERRO: ' + traduz(e2.message));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-base)] hacker-bg z-[1000] p-4">
      <div className="w-full max-w-[400px] p-9 px-9 bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-[10px] shadow-[0_0_20px_rgba(168,85,247,0.3)]">
        <div className="text-center mb-8">
          <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-[2px] mb-2">// GBR_SOLUTIONS v3.0</div>
          <h1 className="text-[26px] font-extrabold gradient-text">GBR Soluções</h1>
          <p className="text-[var(--text-secondary)] text-xs mt-1 tracking-wide uppercase font-mono">Sistema de Gestão ∙ Sobrinho de Aluguel</p>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] tracking-wide uppercase text-[var(--text-secondary)] mb-1.5 font-mono">E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="seu@email.com"
            className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-sm font-mono outline-none focus:border-[var(--purple-bright)] focus:shadow-[0_0_12px_rgba(124,58,237,0.3)]" />
        </div>
        <div className="mb-4">
          <label className="block text-[11px] tracking-wide uppercase text-[var(--text-secondary)] mb-1.5 font-mono">Senha</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="••••••••"
            className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-sm font-mono outline-none focus:border-[var(--purple-bright)] focus:shadow-[0_0_12px_rgba(124,58,237,0.3)]" />
        </div>
        <button onClick={login} disabled={loading}
          className="w-full py-3.5 mt-2 bg-gradient-to-br from-[var(--purple-mid)] to-[var(--purple-bright)] text-white text-sm font-bold tracking-[2px] uppercase font-mono rounded-md cursor-pointer transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(74,0,224,0.5)] disabled:opacity-50">
          {loading ? '[ AUTENTICANDO... ]' : '[ ACESSAR SISTEMA ]'}
        </button>
        {err && <div className="text-[var(--red-alert)] text-xs font-mono mt-2.5 text-center">{err}</div>}

        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <button onClick={() => setShowCfg(s => !s)}
            className="w-full text-left text-[11px] font-mono text-[var(--purple-neon)] flex items-center justify-between">
            <span>⚙️ Configurar Supabase {hasSupabase ? '(✅ conectado)' : '(⚠️ pendente)'}</span>
            <span>{showCfg ? '▲' : '▼'}</span>
          </button>

          {showCfg && (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] tracking-wide uppercase text-[var(--text-muted)] mb-1 font-mono">Project URL</label>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co"
                  className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-xs font-mono outline-none focus:border-[var(--purple-bright)]" />
              </div>
              <div>
                <label className="block text-[10px] tracking-wide uppercase text-[var(--text-muted)] mb-1 font-mono">Anon Public Key</label>
                <input value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGci..."
                  className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-xs font-mono outline-none focus:border-[var(--purple-bright)]" />
              </div>
              <button onClick={salvarCreds}
                className="w-full py-2.5 bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold rounded-md cursor-pointer hover:border-[var(--purple-mid)] hover:text-[var(--purple-neon)] transition-all">
                💾 Salvar e Conectar
              </button>
              <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed text-center">
                Encontre em: Supabase → ⚙️ Project Settings → API
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
