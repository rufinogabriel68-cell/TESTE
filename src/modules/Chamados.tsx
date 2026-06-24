import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Chamado } from '../types';
import { fmtDate, nextNum, STATUS_BADGE } from '../lib/helpers';
import {
  SectionHeader, Card, Badge, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea, Select,
} from '../components/ui';

const blank = (): Partial<Chamado> => ({ status: 'Novo' });

export default function Chamados({ onConvert }: { onConvert: (c: Chamado) => void }) {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Chamado>>(blank());
  const set = (k: keyof Chamado, v: any) => setForm(f => ({ ...f, [k]: v }));

  const list = [...db.chamados].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const novo = () => { if (!guardEdit()) return; setForm(blank()); setOpen(true); };
  const edit = (c: Chamado) => { if (!guardEdit()) return; setForm(c); setOpen(true); };

  const salvar = () => {
    if (!form.nome?.trim()) { toast('Informe o nome!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.chamados.find(c => c.id === id);
      const num = existing ? existing.num : nextNum(prev.chamados);
      const rec: Chamado = {
        id, num, nome: form.nome!.trim(), contato: form.contato || '',
        problema: form.problema || '', status: form.status || 'Novo',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, chamados: existing ? prev.chamados.map(c => c.id === id ? rec : c) : [...prev.chamados, rec] };
    });
    setOpen(false);
    toast('Chamado salvo!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir chamado?')) return;
    mutate(prev => ({ ...prev, chamados: prev.chamados.filter(c => c.id !== id) }));
  };

  const converter = (c: Chamado) => {
    if (!guardEdit()) return;
    mutate(prev => ({ ...prev, chamados: prev.chamados.map(x => x.id === c.id ? { ...x, status: 'Em análise' } : x) }));
    onConvert(c);
    toast('Chamado convertido — preencha os detalhes da OS', 'success');
  };

  return (
    <div>
      <SectionHeader title="Chamados" count={list.length}>
        {canEdit && <Button onClick={novo}>+ Novo Chamado</Button>}
      </SectionHeader>
      <Card noPad>
        <TableWrap>
          <thead><tr><Th>#</Th><Th>Nome</Th><Th>Contato</Th><Th>Problema</Th><Th>Status</Th><Th>Data</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {list.length ? list.map(c => (
              <tr key={c.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                <td className="px-3 py-2.5 text-[13px]"><span className="font-mono text-[var(--purple-neon)]">#{String(c.num || 0).padStart(3, '0')}</span></td>
                <td className="px-3 py-2.5 text-[13px]">{c.nome}</td>
                <td className="px-3 py-2.5 text-[13px]">{c.contato || '—'}</td>
                <td className="px-3 py-2.5 text-[13px] max-w-[160px]">{(c.problema || '').slice(0, 50)}</td>
                <td className="px-3 py-2.5"><Badge kind={STATUS_BADGE[c.status] || 'badge-gray'}>{c.status}</Badge></td>
                <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{fmtDate(c.createdAt)}</td>
                <td className="px-3 py-2.5">
                  {canEdit ? (
                    <div className="flex gap-1">
                      <Button variant="secondary" size="xs" onClick={() => edit(c)}>✏</Button>
                      <Button size="xs" onClick={() => converter(c)}>→OS</Button>
                      <Button variant="danger" size="xs" onClick={() => remover(c.id)}>✕</Button>
                    </div>
                  ) : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}
                </td>
              </tr>
            )) : <tr><td colSpan={7}><EmptyState icon="📩" text="Nenhum chamado" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// CHAMADO" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Nome"><Input value={form.nome || ''} onChange={e => set('nome', e.target.value)} /></Field>
          <Field label="Contato"><Input value={form.contato || ''} onChange={e => set('contato', e.target.value)} /></Field>
          <Field label="Problema" span2><Textarea value={form.problema || ''} onChange={e => set('problema', e.target.value)} /></Field>
          <Field label="Status"><Select value={form.status} onChange={e => set('status', e.target.value)}><option>Novo</option><option>Em análise</option><option>Resolvido</option></Select></Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
