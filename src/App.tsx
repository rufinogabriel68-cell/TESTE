import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './lib/useStore';
import { AppContext, type AppCtx } from './lib/AppContext';
import type { ModuleName, Chamado } from './types';
import Login from './components/Login';
import Dashboard from './modules/Dashboard';
import OSModule from './modules/OSModule';
import Orcamentos from './modules/Orcamentos';
import Chamados from './modules/Chamados';
import CRM from './modules/CRM';
import Garantias from './modules/Garantias';
import Depoimentos from './modules/Depoimentos';
import Estoque from './modules/Estoque';
import Financeiro from './modules/Financeiro';
import Agenda from './modules/Agenda';
import Catalogo from './modules/Catalogo';
import Notas from './modules/Notas';
import Config from './modules/Config';

type ToastItem = { id: number; msg: string; type: string };

const NAV: { section: string; items: { key: ModuleName; icon: string; label: string }[] }[] = [
  { section: '// VISÃO GERAL', items: [{ key: 'dashboard', icon: '📊', label: 'Dashboard' }] },
  { section: '// OPERAÇÕES', items: [
    { key: 'os', icon: '🔧', label: 'Ordens de Serviço' },
    { key: 'orcamentos', icon: '📋', label: 'Orçamentos' },
    { key: 'chamados', icon: '📩', label: 'Chamados' },
  ] },
  { section: '// CLIENTES', items: [
    { key: 'crm', icon: '👥', label: 'CRM / Clientes' },
    { key: 'garantias', icon: '🛡️', label: 'Garantias' },
    { key: 'depoimentos', icon: '⭐', label: 'Depoimentos' },
  ] },
  { section: '// CONTROLE', items: [
    { key: 'estoque', icon: '📦', label: 'Estoque' },
    { key: 'financeiro', icon: '💰', label: 'Financeiro' },
    { key: 'agenda', icon: '📅', label: 'Agenda' },
  ] },
  { section: '// FERRAMENTAS', items: [
    { key: 'catalogo', icon: '🗂️', label: 'Catálogo' },
    { key: 'notas', icon: '📝', label: 'Notas' },
    { key: 'config', icon: '⚙️', label: 'Configurações' },
  ] },
];

const TITLES: Record<ModuleName, string> = {
  dashboard: '// dashboard', os: '// ordens_de_servico', orcamentos: '// orcamentos',
  chamados: '// chamados', crm: '// crm_clientes', garantias: '// garantias',
  depoimentos: '// depoimentos', estoque: '// estoque', financeiro: '// financeiro',
  agenda: '// agenda', catalogo: '// catalogo_servicos', notas: '// notas', config: '// configuracoes',
};

export default function App() {
  const store = useStore();
  const [module, setModule] = useState<ModuleName>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingChamado, setPendingChamado] = useState<Chamado | null>(null);
  const toastId = useRef(0);

  const toast = useCallback((msg: string, type = 'info') => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const guardEdit = useCallback(() => true, []);

  // when a chamado is converted, jump to OS module
  const onConvert = (c: Chamado) => { setPendingChamado(c); setModule('os'); };
  useEffect(() => { if (module !== 'os') setPendingChamado(null); }, [module]);

  if (!store.authReady) {
    return <div className="h-screen flex items-center justify-center text-[var(--text-muted)] font-mono">Carregando...</div>;
  }

  if (!store.session) {
    return <Login supabase={store.supabase} hasSupabase={store.hasSupabase} />;
  }

  const ctx: AppCtx = { ...store, toast, guardEdit };

  const renderModule = () => {
    switch (module) {
      case 'dashboard': return <Dashboard />;
      case 'os': return <OSModule prefill={pendingChamado} />;
      case 'orcamentos': return <Orcamentos />;
      case 'chamados': return <Chamados onConvert={onConvert} />;
      case 'crm': return <CRM />;
      case 'garantias': return <Garantias />;
      case 'depoimentos': return <Depoimentos />;
      case 'estoque': return <Estoque />;
      case 'financeiro': return <Financeiro />;
      case 'agenda': return <Agenda />;
      case 'catalogo': return <Catalogo />;
      case 'notas': return <Notas />;
      case 'config': return <Config />;
    }
  };

  const osPend = store.db.os.filter(o => o.status !== 'Concluído' && o.status !== 'Cancelado').length;
  const chamNovos = store.db.chamados.filter(c => c.status === 'Novo').length;
  const badges: Partial<Record<ModuleName, number>> = { os: osPend, chamados: chamNovos };

  const syncMap = { synced: ['SYNC', 'text-[var(--green-ok)] border-[rgba(0,255,136,0.3)]'], syncing: ['SYNC...', 'text-[var(--cyan-accent)] border-[rgba(0,212,255,0.3)]'], offline: ['OFFLINE', 'text-[var(--yellow-warn)] border-[rgba(255,204,0,0.3)]'] };
  const [syncTxt, syncCls] = syncMap[store.sync];

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden hacker-bg max-md:flex-col">
        {/* SIDEBAR */}
        <nav className={`bg-[var(--bg-panel)] border-r border-[var(--border)] flex flex-col overflow-hidden transition-all max-md:hidden ${collapsed ? 'w-[54px]' : 'w-[220px]'}`}>
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 min-w-8 bg-gradient-to-br from-[var(--purple-mid)] to-[var(--purple-neon)] rounded-lg flex items-center justify-center text-sm font-black text-white font-mono">G</div>
              {!collapsed && <div className="overflow-hidden whitespace-nowrap">
                <h2 className="text-[13px] font-extrabold text-[var(--purple-glow)]">GBR Soluções</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">Sobrinho de Aluguel</p>
              </div>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {NAV.map(grp => (
              <div key={grp.section}>
                {!collapsed && <div className="text-[9px] tracking-[2px] uppercase text-[var(--text-muted)] px-4 pt-2.5 pb-1 font-mono">{grp.section}</div>}
                {grp.items.map(it => (
                  <div key={it.key} onClick={() => setModule(it.key)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all border-l-[3px] whitespace-nowrap ${module === it.key ? 'bg-[rgba(74,0,224,0.15)] border-l-[var(--purple-neon)] text-[var(--purple-neon)]' : 'border-l-transparent hover:bg-[var(--bg-hover)]'}`}>
                    <span className="text-base min-w-5 text-center">{it.icon}</span>
                    {!collapsed && <span className="text-[12.5px] font-medium">{it.label}</span>}
                    {!collapsed && !!badges[it.key] && <span className="ml-auto bg-[var(--red-alert)] text-white text-[9px] font-bold px-1.5 rounded-full font-mono min-w-4 text-center">{badges[it.key]}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-[var(--border)] flex items-center gap-2">
            {!collapsed && <div className="overflow-hidden flex-1">
              <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">{store.session.user.email}</div>
              <div className="text-[9px] font-mono flex items-center gap-1" style={{ color: 'var(--green-ok)' }}>
                <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ background: 'currentColor', animation: 'pulse-dot 2s infinite' }} />
                ONLINE
              </div>
            </div>}
            <button title="Colapsar" onClick={() => setCollapsed(c => !c)} className="text-[var(--text-muted)] hover:text-[var(--purple-neon)] p-1">◀</button>
            <button title="Sair" onClick={async () => { if (confirm('Sair do sistema?')) { await store.supabase?.auth.signOut(); } }} className="text-[var(--text-muted)] hover:text-[var(--purple-neon)] p-1">⏻</button>
          </div>
        </nav>

        {/* MAIN */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-[52px] bg-[var(--bg-panel)] border-b border-[var(--border)] flex items-center px-5 gap-3 shrink-0 max-md:px-3">
            <div className="text-[15px] font-bold flex-1">
              <span className="text-[var(--purple-neon)] font-mono">{TITLES[module]}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border ${syncCls}`} style={store.sync === 'syncing' ? { animation: 'syncing-pulse 1s infinite' } : undefined}>
              <span>●</span><span>{syncTxt}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 max-md:p-3 max-md:pb-20">
            {renderModule()}
          </div>
        </div>

        {/* MOBILE NAV */}
        <nav className="hidden max-md:block fixed bottom-0 left-0 right-0 bg-[var(--bg-panel)] border-t border-[var(--border)] z-[200] pt-1">
          <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.flatMap(g => g.items).map(it => (
              <div key={it.key} onClick={() => setModule(it.key)}
                className={`flex-none flex flex-col items-center px-3.5 py-1.5 cursor-pointer text-lg gap-0.5 border-b-2 ${module === it.key ? 'border-[var(--purple-neon)] text-[var(--purple-neon)]' : 'border-transparent'}`}>
                {it.icon}
                <span className={`text-[9px] font-mono whitespace-nowrap ${module === it.key ? 'text-[var(--purple-neon)]' : 'text-[var(--text-muted)]'}`}>{it.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* TOASTS */}
        <div className="fixed bottom-5 right-5 z-[9000] flex flex-col gap-2 max-md:bottom-20">
          {toasts.map(t => {
            const border = t.type === 'success' ? 'border-l-[var(--green-ok)]' : t.type === 'error' ? 'border-l-[var(--red-alert)]' : t.type === 'warn' ? 'border-l-[var(--yellow-warn)]' : 'border-l-[var(--purple-neon)]';
            return <div key={t.id} className={`px-4 py-3 bg-[var(--bg-panel)] rounded-md border-l-[3px] text-xs font-mono min-w-[220px] max-w-[340px] shadow-[0_0_20px_rgba(168,85,247,0.3)] ${border}`} style={{ animation: 'toast-in 0.3s ease' }}>{t.msg}</div>;
          })}
        </div>
      </div>
    </AppContext.Provider>
  );
}
