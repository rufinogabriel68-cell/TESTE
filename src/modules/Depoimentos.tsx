import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Depoimento } from '../types';
import { fmtDate } from '../lib/helpers';
import {
  SectionHeader, Card, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea,
} from '../components/ui';

export default function Depoimentos() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Depoimento>>({ nota: 5 });
  const set = (k: keyof Depoimento, v: any) => setForm(f => ({ ...f, [k]: v }));

  const novo = () => { if (!guardEdit()) return; setForm({ nota: 5 }); setOpen(true); };
  const edit = (d: Depoimento) => { if (!guardEdit()) return; setForm(d); setOpen(true); };

  const salvar = () => {
    if (!form.cliente?.trim()) { toast('Informe o cliente!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.depoimentos.find(d => d.id === id);
      const rec: Depoimento = {
        id, cliente: form.cliente!.trim(), nota: form.nota || 5, texto: form.texto || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, depoimentos: existing ? prev.depoimentos.map(d => d.id === id ? rec : d) : [...prev.depoimentos, rec] };
    });
    setOpen(false);
    toast('Depoimento salvo!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir?')) return;
    mutate(prev => ({ ...prev, depoimentos: prev.depoimentos.filter(d => d.id !== id) }));
  };

  return (
    <div>
      <SectionHeader title="Depoimentos" count={db.depoimentos.length}>
        {canEdit && <Button onClick={novo}>+ Novo Depoimento</Button>}
      </SectionHeader>
      <Card noPad>
        <TableWrap>
          <thead><tr><Th>Cliente</Th><Th>Nota</Th><Th>Depoimento</Th><Th>Data</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {db.depoimentos.length ? db.depoimentos.map(d => (
              <tr key={d.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                <td className="px-3 py-2.5 text-[13px]">{d.cliente}</td>
                <td className="px-3 py-2.5">{'⭐'.repeat(Math.min(5, Number(d.nota || 5)))}</td>
                <td className="px-3 py-2.5 text-[13px] max-w-[280px] italic text-[var(--text-secondary)]">"{(d.texto || '').slice(0, 100)}"</td>
                <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{fmtDate(d.createdAt)}</td>
                <td className="px-3 py-2.5">
                  {canEdit ? (
                    <div className="flex gap-1">
                      <Button variant="secondary" size="xs" onClick={() => edit(d)}>✏</Button>
                      <Button variant="danger" size="xs" onClick={() => remover(d.id)}>✕</Button>
                    </div>
                  ) : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}
                </td>
              </tr>
            )) : <tr><td colSpan={5}><EmptyState icon="⭐" text="Nenhum depoimento" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// DEPOIMENTO" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Cliente"><Input value={form.cliente || ''} onChange={e => set('cliente', e.target.value)} /></Field>
          <Field label="Nota (1-5)"><Input type="number" min={1} max={5} value={form.nota || ''} onChange={e => set('nota', e.target.value)} /></Field>
          <Field label="Depoimento" span2><Textarea value={form.texto || ''} onChange={e => set('texto', e.target.value)} /></Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
