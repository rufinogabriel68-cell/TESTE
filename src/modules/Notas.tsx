import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Nota } from '../types';
import { fmtDate } from '../lib/helpers';
import {
  SectionHeader, Button, EmptyState,
  Modal, Field, FormGrid, FormActions, Input, Textarea, Select,
} from '../components/ui';

export default function Notas() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Nota>>({});
  const set = (k: keyof Nota, v: any) => setForm(f => ({ ...f, [k]: v }));

  const list = [...db.notas].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const novo = () => { if (!guardEdit()) return; setForm({}); setOpen(true); };
  const edit = (n: Nota) => { if (!guardEdit()) return; setForm(n); setOpen(true); };

  const salvar = () => {
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.notas.find(n => n.id === id);
      const rec: Nota = {
        id, titulo: form.titulo || '', body: form.body || '', pinned: !!form.pinned,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, notas: existing ? prev.notas.map(n => n.id === id ? rec : n) : [...prev.notas, rec] };
    });
    setOpen(false);
    toast('Nota salva!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir nota?')) return;
    mutate(prev => ({ ...prev, notas: prev.notas.filter(n => n.id !== id) }));
  };

  return (
    <div>
      <SectionHeader title="Notas" count={db.notas.length}>
        {canEdit && <Button onClick={novo}>+ Nova Nota</Button>}
      </SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {list.length ? list.map(n => (
          <div key={n.id} onClick={() => canEdit && edit(n)}
            className={`relative bg-[var(--bg-card)] border rounded-[10px] p-4 transition-all ${canEdit ? 'cursor-pointer hover:border-[var(--purple-mid)]' : ''} ${n.pinned ? 'border-[var(--yellow-warn)]' : 'border-[var(--border)]'}`}>
            {n.pinned && <span className="absolute top-2.5 right-2.5 text-xs">📌</span>}
            <div className="text-[13px] font-bold mb-2 text-[var(--purple-glow)]">{n.titulo || 'Sem título'}</div>
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-4">{n.body}</div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="text-[10px] text-[var(--text-muted)] font-mono">{fmtDate(n.createdAt)}</div>
              {canEdit && <Button variant="danger" size="xs" onClick={e => { e.stopPropagation(); remover(n.id); }}>✕</Button>}
            </div>
          </div>
        )) : <div className="col-span-full"><EmptyState icon="📝" text="Nenhuma nota" /></div>}
      </div>

      <Modal title="// NOTA" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Título" span2><Input value={form.titulo || ''} onChange={e => set('titulo', e.target.value)} /></Field>
          <Field label="Conteúdo" span2><Textarea rows={5} value={form.body || ''} onChange={e => set('body', e.target.value)} /></Field>
          <Field label="Fixar"><Select value={form.pinned ? '1' : '0'} onChange={e => set('pinned', e.target.value === '1')}><option value="0">Não</option><option value="1">Sim</option></Select></Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
