import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type EstoqueItem } from '../types';
import { fmt } from '../lib/helpers';
import {
  SectionHeader, Card, Badge, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Select,
} from '../components/ui';

const blank = (): Partial<EstoqueItem> => ({ categoria: 'Geral', qty: 0, min: 0 });

export default function Estoque() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<EstoqueItem>>(blank());
  const set = (k: keyof EstoqueItem, v: any) => setForm(f => ({ ...f, [k]: v }));

  const novo = () => { if (!guardEdit()) return; setForm(blank()); setOpen(true); };
  const edit = (e: EstoqueItem) => { if (!guardEdit()) return; setForm(e); setOpen(true); };

  const salvar = () => {
    if (!form.nome?.trim()) { toast('Informe o nome!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.estoque.find(e => e.id === id);
      const rec: EstoqueItem = {
        id, nome: form.nome!.trim(), categoria: form.categoria || 'Geral',
        qty: Number(form.qty) || 0, min: Number(form.min) || 0, custo: form.custo || '',
        local: form.local || '', fornecedor: form.fornecedor || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, estoque: existing ? prev.estoque.map(e => e.id === id ? rec : e) : [...prev.estoque, rec] };
    });
    setOpen(false);
    toast('Item salvo!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir item?')) return;
    mutate(prev => ({ ...prev, estoque: prev.estoque.filter(e => e.id !== id) }));
  };

  const alertas = db.estoque.filter(e => Number(e.qty || 0) <= Number(e.min || 0));

  return (
    <div>
      <SectionHeader title="Estoque" count={db.estoque.length}>
        {canEdit && <Button onClick={novo}>+ Novo Item</Button>}
      </SectionHeader>
      {alertas.map(e => (
        <div key={e.id} className="flex items-center gap-2 px-3 py-2 bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.2)] rounded-md text-xs text-[var(--red-alert)] mb-2">
          ⚠ <strong>{e.nome}</strong> abaixo do mínimo ({e.qty} / mín {e.min})
        </div>
      ))}
      <Card noPad>
        <TableWrap>
          <thead><tr><Th>Item</Th><Th>Categoria</Th><Th>Qtd.</Th><Th>Mín.</Th><Th>Custo</Th><Th>Local</Th><Th>Fornecedor</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {db.estoque.length ? db.estoque.map(e => {
              const baixo = Number(e.qty || 0) <= Number(e.min || 0);
              return (
                <tr key={e.id} className={`hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)] ${baixo ? 'bg-[rgba(255,51,102,0.04)]' : ''}`}>
                  <td className="px-3 py-2.5 text-[13px]"><strong>{e.nome}</strong>{baixo && <span className="text-[var(--red-alert)] text-[10px]"> ●</span>}</td>
                  <td className="px-3 py-2.5"><Badge kind="badge-gray">{e.categoria}</Badge></td>
                  <td className={`px-3 py-2.5 font-mono ${baixo ? 'text-[var(--red-alert)]' : 'text-[var(--green-ok)]'}`}>{e.qty || 0}</td>
                  <td className="px-3 py-2.5 font-mono text-[var(--text-muted)]">{e.min || 0}</td>
                  <td className="px-3 py-2.5 font-mono text-[13px]">{fmt(e.custo)}</td>
                  <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{e.local || '—'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{e.fornecedor || '—'}</td>
                  <td className="px-3 py-2.5">
                    {canEdit ? (
                      <div className="flex gap-1">
                        <Button variant="secondary" size="xs" onClick={() => edit(e)}>✏</Button>
                        <Button variant="danger" size="xs" onClick={() => remover(e.id)}>✕</Button>
                      </div>
                    ) : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={8}><EmptyState icon="📦" text="Estoque vazio" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// ITEM DE ESTOQUE" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Nome do Item" span2><Input value={form.nome || ''} onChange={e => set('nome', e.target.value)} /></Field>
          <Field label="Categoria"><Select value={form.categoria} onChange={e => set('categoria', e.target.value)}><option>Elétrica</option><option>Informática</option><option>Redes</option><option>CFTV</option><option>Automação</option><option>Geral</option></Select></Field>
          <Field label="Quantidade"><Input type="number" min={0} value={form.qty ?? 0} onChange={e => set('qty', e.target.value)} /></Field>
          <Field label="Mínimo"><Input type="number" min={0} value={form.min ?? 0} onChange={e => set('min', e.target.value)} /></Field>
          <Field label="Custo (R$)"><Input type="number" step="0.01" value={form.custo || ''} onChange={e => set('custo', e.target.value)} /></Field>
          <Field label="Localização"><Input value={form.local || ''} onChange={e => set('local', e.target.value)} /></Field>
          <Field label="Fornecedor"><Input value={form.fornecedor || ''} onChange={e => set('fornecedor', e.target.value)} /></Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
