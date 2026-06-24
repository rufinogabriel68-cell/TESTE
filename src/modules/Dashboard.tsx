import { useApp } from '../lib/AppContext';
import { fmt } from '../lib/helpers';
import { diasRestantes } from '../lib/helpers';
import { Card, CardHeader, Badge, EmptyState, TableWrap, Th } from '../components/ui';
import { STATUS_BADGE } from '../lib/helpers';

export default function Dashboard() {
  const { db } = useApp();
  const hoje = new Date();
  const mes = hoje.getMonth(), ano = hoje.getFullYear();

  const inMonth = (d: string) => { const dt = new Date(d); return dt.getMonth() === mes && dt.getFullYear() === ano; };

  const receitas = db.financeiro.receitas.filter(r => inMonth(r.data)).reduce((s, r) => s + Number(r.valor || 0), 0);
  const despesas = db.financeiro.despesas.filter(d => inMonth(d.data)).reduce((s, d) => s + Number(d.valor || 0), 0);
  const lucro = receitas - despesas;
  const osAbertas = db.os.filter(o => o.status === 'Aguardando' || o.status === 'Em andamento').length;
  const osConcluidas = db.os.filter(o => o.status === 'Concluído' && inMonth(o.updatedAt || o.createdAt || '')).length;

  const kpis = [
    { label: 'Receita do Mês', value: fmt(receitas), icon: '💰', sub: 'mês atual' },
    { label: 'Lucro Líquido', value: fmt(lucro), icon: '📈', sub: `despesas: ${fmt(despesas)}` },
    { label: 'OS Abertas', value: osAbertas, icon: '🔧', sub: 'em andamento' },
    { label: 'OS Concluídas', value: osConcluidas, icon: '✅', sub: 'este mês' },
    { label: 'Clientes', value: db.clientes.length, icon: '👥', sub: 'cadastrados' },
    { label: 'Chamados Novos', value: db.chamados.filter(c => c.status === 'Novo').length, icon: '📩', sub: 'aguardando' },
  ];

  const atv = [...db.os].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);

  const alertas: { msg: string; cls: string }[] = [];
  db.estoque.filter(e => Number(e.qty || 0) <= Number(e.min || 0)).forEach(e => alertas.push({ msg: `Estoque baixo: ${e.nome}`, cls: 'border-l-[var(--red-alert)]' }));
  db.garantias.forEach(g => { const d = diasRestantes(g.data, g.prazo); if (d <= 30 && d >= 0) alertas.push({ msg: `Garantia vencendo: ${g.cliente} (${d}d)`, cls: 'border-l-[var(--yellow-warn)]' }); });
  db.chamados.filter(c => c.status === 'Novo').forEach(c => alertas.push({ msg: `Chamado novo: ${c.nome}`, cls: 'border-l-[var(--red-alert)]' }));

  const metaMes = Number(db.config.metaMes || 5000);
  const pct = Math.min(100, Math.round((receitas / metaMes) * 100));

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 mb-4">
        {kpis.map((k, i) => (
          <div key={i} className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] rounded-[10px] p-4.5 p-[18px] hover:border-[var(--purple-mid)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--purple-mid)] to-[var(--purple-neon)]" />
            <div className="absolute right-3.5 top-3.5 text-[22px] opacity-20">{k.icon}</div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-mono mb-2">{k.label}</div>
            <div className="text-[26px] font-extrabold font-mono text-[var(--purple-glow)] leading-none">{k.value}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="⚡ Atividade Recente" />
          {atv.length ? (
            <TableWrap>
              <thead><tr><Th>#</Th><Th>Cliente</Th><Th>Status</Th><Th>Valor</Th></tr></thead>
              <tbody>
                {atv.map(o => (
                  <tr key={o.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                    <td className="px-3 py-2.5 text-[13px]"><span className="font-mono text-[var(--purple-neon)]">#{String(o.num || 0).padStart(3, '0')}</span></td>
                    <td className="px-3 py-2.5 text-[13px]">{o.cliente || '—'}</td>
                    <td className="px-3 py-2.5"><Badge kind={STATUS_BADGE[o.status] || 'badge-gray'}>{o.status}</Badge></td>
                    <td className="px-3 py-2.5 text-[13px] font-mono">{fmt(o.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          ) : <EmptyState icon="📂" text="Nenhuma OS ainda" />}
        </Card>

        <Card>
          <CardHeader title="🚨 Alertas" />
          <div className="flex flex-col gap-2">
            {alertas.length ? alertas.map((a, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3.5 py-2.5 bg-[var(--bg-hover)] rounded-md border-l-[3px] text-xs ${a.cls}`}>⚠ {a.msg}</div>
            )) : <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[var(--bg-hover)] rounded-md border-l-[3px] border-l-[var(--green-ok)] text-xs">✅ Tudo em ordem — nenhum alerta!</div>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="🎯 Metas do Mês" />
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-[var(--text-secondary)]">Meta Mensal</span>
          <span className="font-mono text-xs text-[var(--purple-neon)]">{fmt(receitas)} / {fmt(metaMes)} ({pct}%)</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--purple-mid)] to-[var(--purple-neon)] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </Card>
    </div>
  );
}
