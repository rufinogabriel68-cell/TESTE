import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Garantia } from '../types';
import { fmtDate, diasRestantes } from '../lib/helpers';
import {
  SectionHeader, Card, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea,
} from '../components/ui';

export default function Garantias() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Garantia>>({});
  const set = (k: keyof Garantia, v: any) => setForm(f => ({ ...f, [k]: v }));

  const novo = () => { if (!guardEdit()) return; setForm({}); setOpen(true); };

  const salvar = () => {
    if (!form.cliente?.trim() || !form.data) { toast('Preencha os campos obrigatórios', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.garantias.find(g => g.id === id);
      const rec: Garantia = {
        id, cliente: form.cliente!.trim(), servico: form.servico || '',
        data: form.data!, prazo: form.prazo || 90, obs: form.obs || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, garantias: existing ? prev.garantias.map(g => g.id === id ? rec : g) : [...prev.garantias, rec] };
    });
    setOpen(false);
    toast('Garantia salva!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir?')) return;
    mutate(prev => ({ ...prev, garantias: prev.garantias.filter(g => g.id !== id) }));
  };

  return (
    <div>
      <SectionHeader title="Garantias" count={db.garantias.length}>
        {canEdit && <Button onClick={novo}>+ Nova Garantia</Button>}
      </SectionHeader>
      <Card noPad>
        <TableWrap>
          <thead><tr><Th>Cliente</Th><Th>Serviço/Peça</Th><Th>Data Serviço</Th><Th>Prazo</Th><Th>Vencimento</Th><Th>Restam</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {db.garantias.length ? db.garantias.map(g => {
              const dias = diasRestantes(g.data, g.prazo);
              const cls = dias < 0 ? 'text-[var(--red-alert)]' : dias <= 30 ? 'text-[var(--yellow-warn)]' : 'text-[var(--green-ok)]';
              const txt = dias < 0 ? `Vencida (${Math.abs(dias)}d)` : `${dias} dias`;
              const venc = new Date(g.data + 'T00:00:00'); venc.setDate(venc.getDate() + Number(g.prazo || 90));
              return (
                <tr key={g.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                  <td className="px-3 py-2.5 text-[13px]">{g.cliente}</td>
                  <td className="px-3 py-2.5 text-[13px]">{g.servico || '—'}</td>
                  <td className="px-3 py-2.5 text-[11px]">{fmtDate(g.data)}</td>
                  <td className="px-3 py-2.5 text-[13px] font-mono">{g.prazo || 90}d</td>
                  <td className="px-3 py-2.5 text-[11px]">{venc.toLocaleDateString('pt-BR')}</td>
                  <td className="px-3 py-2.5"><span className={`font-mono text-xs ${cls}`}>{txt}</span></td>
                  <td className="px-3 py-2.5">{canEdit ? <Button variant="danger" size="xs" onClick={() => remover(g.id)}>✕</Button> : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}</td>
                </tr>
              );
            }) : <tr><td colSpan={7}><EmptyState icon="🛡️" text="Nenhuma garantia" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// GARANTIA" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Cliente"><Input value={form.cliente || ''} onChange={e => set('cliente', e.target.value)} /></Field>
          <Field label="Serviço / Peça"><Input value={form.servico || ''} onChange={e => set('servico', e.target.value)} /></Field>
          <Field label="Data do Serviço"><Input type="date" value={form.data || ''} onChange={e => set('data', e.target.value)} /></Field>
          <Field label="Prazo (dias)"><Input type="number" placeholder="90" value={form.prazo || ''} onChange={e => set('prazo', e.target.value)} /></Field>
          <Field label="Obs" span2><Textarea value={form.obs || ''} onChange={e => set('obs', e.target.value)} /></Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
