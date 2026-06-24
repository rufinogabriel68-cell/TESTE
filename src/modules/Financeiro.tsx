import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Movimento } from '../types';
import { fmt, fmtDate, todayStr } from '../lib/helpers';
import {
  Card, CardHeader, Badge, Button, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Select,
} from '../components/ui';

export default function Financeiro() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [modal, setModal] = useState<'' | 'receita' | 'despesa'>('');
  const [form, setForm] = useState<Partial<Movimento>>({});
  const set = (k: keyof Movimento, v: any) => setForm(f => ({ ...f, [k]: v }));

  const hoje = new Date();
  const mes = hoje.getMonth(), ano = hoje.getFullYear();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const inMonth = (d: string) => { const dt = new Date(d); return dt.getMonth() === mes && dt.getFullYear() === ano; };

  const recsMes = db.financeiro.receitas.filter(r => inMonth(r.data));
  const desMes = db.financeiro.despesas.filter(d => inMonth(d.data));
  const totRec = recsMes.reduce((s, r) => s + Number(r.valor || 0), 0);
  const totDes = desMes.reduce((s, d) => s + Number(d.valor || 0), 0);
  const lucro = totRec - totDes;
  const metaMes = Number(db.config.metaMes || 5000);

  const abrir = (tipo: 'receita' | 'despesa') => {
    if (!guardEdit()) return;
    setForm({ data: todayStr(), cat: tipo === 'receita' ? 'OS' : 'Peças' });
    setModal(tipo);
  };

  const salvar = () => {
    if (!form.valor) { toast('Informe o valor', 'error'); return; }
    const rec: Movimento = { id: genId(), desc: form.desc || '', valor: form.valor, data: form.data || todayStr(), cat: form.cat || '', createdAt: new Date().toISOString() };
    mutate(prev => {
      if (modal === 'receita') return { ...prev, financeiro: { ...prev.financeiro, receitas: [...prev.financeiro.receitas, rec] } };
      return { ...prev, financeiro: { ...prev.financeiro, despesas: [...prev.financeiro.despesas, rec] } };
    });
    setModal('');
    toast(modal === 'receita' ? 'Receita adicionada!' : 'Despesa adicionada!', 'success');
  };

  const delRec = (id: string) => { if (!guardEdit()) return; mutate(prev => ({ ...prev, financeiro: { ...prev.financeiro, receitas: prev.financeiro.receitas.filter(r => r.id !== id) } })); };
  const delDes = (id: string) => { if (!guardEdit()) return; mutate(prev => ({ ...prev, financeiro: { ...prev.financeiro, despesas: prev.financeiro.despesas.filter(d => d.id !== id) } })); };

  const kpis = [
    { val: fmt(totRec), lbl: 'Receitas', color: 'var(--green-ok)' },
    { val: fmt(totDes), lbl: 'Despesas', color: 'var(--red-alert)' },
    { val: fmt(lucro), lbl: 'Lucro Líquido', color: lucro >= 0 ? 'var(--purple-neon)' : 'var(--red-alert)' },
    { val: Math.min(100, Math.round((totRec / metaMes) * 100)) + '%', lbl: 'Meta atingida', color: 'var(--cyan-accent)' },
  ];

  return (
    <div>
      <div className="text-lg font-extrabold mb-4">Financeiro <span className="text-[11px] text-[var(--purple-neon)] font-mono font-normal ml-2">{meses[mes]} {ano}</span></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[10px] p-4 text-center">
            <div className="text-[22px] font-extrabold font-mono" style={{ color: k.color }}>{k.val}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono uppercase tracking-wide">{k.lbl}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="💸 Receitas">{canEdit ? <Button size="sm" onClick={() => abrir('receita')}>+ Receita</Button> : <span />}</CardHeader>
          <TableWrap>
            <thead><tr><Th>Descrição</Th><Th>Valor</Th><Th>Data</Th><Th></Th></tr></thead>
            <tbody>
              {recsMes.length ? recsMes.map(r => (
                <tr key={r.id} className="border-b border-[rgba(30,30,58,0.5)]">
                  <td className="px-3 py-2.5 text-[13px]">{r.desc || '—'} <Badge kind="badge-gray">{r.cat}</Badge></td>
                  <td className="px-3 py-2.5 font-mono text-[var(--green-ok)]">{fmt(r.valor)}</td>
                  <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{fmtDate(r.data)}</td>
                  <td className="px-3 py-2.5">{canEdit && <Button variant="danger" size="xs" onClick={() => delRec(r.id)}>✕</Button>}</td>
                </tr>
              )) : <tr><td colSpan={4} className="text-center py-5 text-[var(--text-muted)]">Nenhuma receita</td></tr>}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <CardHeader title="📤 Despesas">{canEdit ? <Button size="sm" onClick={() => abrir('despesa')}>+ Despesa</Button> : <span />}</CardHeader>
          <TableWrap>
            <thead><tr><Th>Descrição</Th><Th>Valor</Th><Th>Data</Th><Th></Th></tr></thead>
            <tbody>
              {desMes.length ? desMes.map(d => (
                <tr key={d.id} className="border-b border-[rgba(30,30,58,0.5)]">
                  <td className="px-3 py-2.5 text-[13px]">{d.desc || '—'} <Badge kind="badge-gray">{d.cat}</Badge></td>
                  <td className="px-3 py-2.5 font-mono text-[var(--red-alert)]">{fmt(d.valor)}</td>
                  <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{fmtDate(d.data)}</td>
                  <td className="px-3 py-2.5">{canEdit && <Button variant="danger" size="xs" onClick={() => delDes(d.id)}>✕</Button>}</td>
                </tr>
              )) : <tr><td colSpan={4} className="text-center py-5 text-[var(--text-muted)]">Nenhuma despesa</td></tr>}
            </tbody>
          </TableWrap>
        </Card>
      </div>

      <Modal title={modal === 'receita' ? '// RECEITA' : '// DESPESA'} open={!!modal} onClose={() => setModal('')}>
        <FormGrid>
          <Field label="Descrição" span2><Input value={form.desc || ''} onChange={e => set('desc', e.target.value)} /></Field>
          <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor || ''} onChange={e => set('valor', e.target.value)} /></Field>
          <Field label="Data"><Input type="date" value={form.data || ''} onChange={e => set('data', e.target.value)} /></Field>
          <Field label="Categoria">
            <Select value={form.cat} onChange={e => set('cat', e.target.value)}>
              {modal === 'receita'
                ? <><option>OS</option><option>Orçamento</option><option>Mensalidade</option><option>Outro</option></>
                : <><option>Peças</option><option>Ferramentas</option><option>Combustível</option><option>Marketing</option><option>Imposto</option><option>Outro</option></>}
            </Select>
          </Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setModal('')}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
