import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Servico } from '../types';
import { fmt } from '../lib/helpers';
import {
  SectionHeader, Card, Badge, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea, Select,
} from '../components/ui';

const blank = (): Partial<Servico> => ({ categoria: 'Geral' });

export default function Catalogo() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Servico>>(blank());
  const set = (k: keyof Servico, v: any) => setForm(f => ({ ...f, [k]: v }));

  const novo = () => { if (!guardEdit()) return; setForm(blank()); setOpen(true); };
  const edit = (s: Servico) => { if (!guardEdit()) return; setForm(s); setOpen(true); };

  const salvar = () => {
    if (!form.nome?.trim()) { toast('Informe o nome!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.catalogo.find(s => s.id === id);
      const rec: Servico = {
        id, nome: form.nome!.trim(), categoria: form.categoria || 'Geral',
        preco: form.preco || '', duracao: form.duracao || '', desc: form.desc || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, catalogo: existing ? prev.catalogo.map(s => s.id === id ? rec : s) : [...prev.catalogo, rec] };
    });
    setOpen(false);
    toast('Serviço salvo!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir serviço?')) return;
    mutate(prev => ({ ...prev, catalogo: prev.catalogo.filter(s => s.id !== id) }));
  };

  return (
    <div>
      <SectionHeader title="Catálogo de Serviços" count={db.catalogo.length}>
        {canEdit && <Button onClick={novo}>+ Novo Serviço</Button>}
      </SectionHeader>
      <Card noPad>
        <TableWrap>
          <thead><tr><Th>Serviço</Th><Th>Categoria</Th><Th>Preço</Th><Th>Duração</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {db.catalogo.length ? db.catalogo.map(s => (
              <tr key={s.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                <td className="px-3 py-2.5 text-[13px]"><strong>{s.nome}</strong><br /><small className="text-[var(--text-muted)]">{s.desc}</small></td>
                <td className="px-3 py-2.5"><Badge kind="badge-purple">{s.categoria}</Badge></td>
                <td className="px-3 py-2.5 font-mono text-[var(--green-ok)]">{fmt(s.preco)}</td>
                <td className="px-3 py-2.5 text-[var(--text-muted)]">{s.duracao ? s.duracao + 'min' : '—'}</td>
                <td className="px-3 py-2.5">
                  {canEdit ? (
                    <div className="flex gap-1">
                      <Button variant="secondary" size="xs" onClick={() => edit(s)}>✏</Button>
                      <Button variant="danger" size="xs" onClick={() => remover(s.id)}>✕</Button>
                    </div>
                  ) : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}
                </td>
              </tr>
            )) : <tr><td colSpan={5}><EmptyState icon="🗂️" text="Catálogo vazio" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// SERVIÇO" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Nome do Serviço" span2><Input value={form.nome || ''} onChange={e => set('nome', e.target.value)} /></Field>
          <Field label="Categoria"><Select value={form.categoria} onChange={e => set('categoria', e.target.value)}><option>Elétrica</option><option>Informática</option><option>Redes</option><option>CFTV</option><option>Automação</option><option>Geral</option></Select></Field>
          <Field label="Preço (R$)"><Input type="number" step="0.01" value={form.preco || ''} onChange={e => set('preco', e.target.value)} /></Field>
          <Field label="Duração (min)"><Input type="number" value={form.duracao || ''} onChange={e => set('duracao', e.target.value)} /></Field>
          <Field label="Descrição" span2><Textarea value={form.desc || ''} onChange={e => set('desc', e.target.value)} /></Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
