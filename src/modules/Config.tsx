import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { emptyDB, type DB } from '../types';
import { Card, CardHeader, Button, Field, FormGrid, Input } from '../components/ui';
import { getStoredCreds, setStoredCreds } from '../lib/supabase';

const SQL = `-- WORKSPACE (1 linha por usuário, dados em JSON)
create table if not exists workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table workspaces enable row level security;
create policy "own workspace" on workspaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TRAVA DE EDIÇÃO (só 1 dispositivo edita por vez)
create table if not exists edit_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text,
  heartbeat timestamptz not null default now()
);
alter table edit_locks enable row level security;
create policy "own lock" on edit_locks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`;

export default function Config() {
  const { db, mutate, toast, guardEdit, canEdit, hasSupabase, refreshCreds, lock } = useApp();
  const creds = getStoredCreds();
  const [url, setUrl] = useState(creds.url);
  const [key, setKey] = useState(creds.key);
  const [cfg, setCfg] = useState(db.config);
  const setC = (k: keyof typeof cfg, v: any) => setCfg(c => ({ ...c, [k]: v }));

  const salvarConfig = () => {
    if (!guardEdit()) return;
    mutate(prev => ({ ...prev, config: cfg }));
    toast('Configurações salvas!', 'success');
  };

  const salvarCreds = () => {
    setStoredCreds(url.trim(), key.trim());
    refreshCreds();
    toast('Credenciais salvas! Recarregue a página para conectar.', 'success');
  };

  const exportar = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gbr-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast('Backup exportado!', 'success');
  };

  const importar = (input: HTMLInputElement) => {
    if (!guardEdit()) return;
    const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imp = JSON.parse(e.target?.result as string) as Partial<DB>;
        mutate(prev => ({ ...emptyDB(), ...prev, ...imp,
          config: { ...prev.config, ...(imp.config || {}) },
          financeiro: { receitas: imp.financeiro?.receitas || prev.financeiro.receitas, despesas: imp.financeiro?.despesas || prev.financeiro.despesas } }));
        toast('Dados importados!', 'success');
      } catch { toast('Arquivo inválido!', 'error'); }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="text-lg font-extrabold mb-5">⚙️ Configurações</div>

      <Card>
        <CardHeader title="🔑 Supabase" />
        <div className="text-xs font-mono text-[var(--text-secondary)] mb-3 leading-relaxed">
          Status: {hasSupabase
            ? <span className="text-[var(--green-ok)]">✅ Configurado</span>
            : <span className="text-[var(--yellow-warn)]">⚠️ Não configurado — modo offline (dados só neste dispositivo)</span>}
        </div>
        <FormGrid>
          <Field label="Project URL" span2><Input placeholder="https://xxxx.supabase.co" value={url} onChange={e => setUrl(e.target.value)} /></Field>
          <Field label="Anon Public Key" span2><Input placeholder="eyJhbGci..." value={key} onChange={e => setKey(e.target.value)} /></Field>
        </FormGrid>
        <div className="flex gap-2 mt-4">
          <Button onClick={salvarCreds}>💾 Salvar Credenciais</Button>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-mono text-[var(--purple-neon)]">▸ Ver SQL para criar as tabelas no Supabase</summary>
          <pre className="mt-2 p-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-[10px] text-[var(--text-secondary)] overflow-x-auto whitespace-pre">{SQL}</pre>
        </details>
      </Card>

      <Card>
        <CardHeader title="🔒 Trava de Edição" />
        <div className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
          {lock.isEditor
            ? <p>Este dispositivo está em <span className="text-[var(--green-ok)]">modo EDITOR</span> — você pode alterar os dados.</p>
            : lock.otherDevice
              ? <p>Outro dispositivo (<span className="text-[var(--yellow-warn)]">{lock.otherDevice}</span>) está editando. Você está em <span className="text-[var(--cyan-accent)]">modo VISUALIZAÇÃO</span>.</p>
              : <p>Modo visualização. Sem conexão de edição ativa.</p>}
          <p className="mt-2 text-[var(--text-muted)]">Apenas 1 dispositivo pode editar por vez. A trava libera automaticamente após 30s de inatividade ou ao sair.</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="🏢 Empresa" />
        <FormGrid>
          <Field label="Nome"><Input value={cfg.nome || ''} onChange={e => setC('nome', e.target.value)} disabled={!canEdit} /></Field>
          <Field label="CNPJ/CPF"><Input value={cfg.cnpj || ''} onChange={e => setC('cnpj', e.target.value)} disabled={!canEdit} /></Field>
          <Field label="Telefone"><Input value={cfg.tel || ''} onChange={e => setC('tel', e.target.value)} disabled={!canEdit} /></Field>
          <Field label="Cidade"><Input value={cfg.cidade || ''} onChange={e => setC('cidade', e.target.value)} disabled={!canEdit} /></Field>
          <Field label="Meta Mensal (R$)"><Input type="number" value={cfg.metaMes || ''} onChange={e => setC('metaMes', e.target.value)} disabled={!canEdit} /></Field>
          <Field label="Meta Anual (R$)"><Input type="number" value={cfg.metaAno || ''} onChange={e => setC('metaAno', e.target.value)} disabled={!canEdit} /></Field>
        </FormGrid>
        {canEdit && <div className="flex mt-4"><Button onClick={salvarConfig}>💾 Salvar</Button></div>}
      </Card>

      <Card>
        <CardHeader title="💾 Backup & Dados" />
        <div className="flex gap-2.5 flex-wrap">
          <Button variant="secondary" onClick={exportar}>📤 Exportar JSON</Button>
          {canEdit && <>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold cursor-pointer rounded-md bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--purple-mid)]">
              📥 Importar JSON
              <input type="file" accept=".json" className="hidden" onChange={e => importar(e.target)} />
            </label>
          </>}
        </div>
      </Card>
    </div>
  );
}
