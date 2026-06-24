import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Cliente } from '../types';
import { TIPO_CRM_BADGE } from '../lib/helpers';
import {
  SectionHeader, Card, Badge, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea, Select,
} from '../components/ui';

const blank = (): Partial<Cliente> => ({ tipo: 'Novo', origem: 'Instagram' });

export default function CRM() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Cliente>>(blank());
  const set = (k: keyof Cliente, v: any) => setForm(f => ({ ...f, [k]: v }));

  let list = [...db.clientes].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  if (search) list = list.filter(c => (c.nome || '').toLowerCase().includes(search.toLowerCase()) || (c.tel || '').includes(search) || (c.email || '').toLowerCase().includes(search.toLowerCase()));

  const novo = () => { if (!guardEdit()) return; setForm(blank()); setOpen(true); };
  const edit = (c: Cliente) => { if (!guardEdit()) return; setForm(c); setOpen(true); };

  const salvar = () => {
    if (!form.nome?.trim()) { toast('Informe o nome!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.clientes.find(c => c.id === id);
      const rec: Cliente = {
        id, nome: form.nome!.trim(), tel: form.tel || '', email: form.email || '',
        tipo: form.tipo || 'Novo', origem: form.origem || 'Instagram', endereco: form.endereco || '',
        nps: form.nps || '', obs: form.obs || '', createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, clientes: existing ? prev.clientes.map(c => c.id === id ? rec : c) : [...prev.clientes, rec] };
    });
    setOpen(false);
    toast('Cliente salvo!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir cliente?')) return;
    mutate(prev => ({ ...prev, clientes: prev.clientes.filter(c => c.id !== id) }));
  };

  return (
    <div>
      <SectionHeader title="CRM / Clientes" count={db.clientes.length}>
        <Input placeholder="🔍 Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        {canEdit && <Button onClick={novo}>+ Novo Cliente</Button>}
      </SectionHeader>
      <Card noPad>
        <TableWrap>
          <thead><tr><Th>Nome</Th><Th>Telefone</Th><Th>E-mail</Th><Th>Tipo</Th><Th>Origem</Th><Th>OS</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {list.length ? list.map(c => {
              const qtdOS = db.os.filter(o => o.cliente?.toLowerCase() === c.nome?.toLowerCase()).length;
              return (
                <tr key={c.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                  <td className="px-3 py-2.5 text-[13px]"><strong>{c.nome}</strong></td>
                  <td className="px-3 py-2.5 text-[13px] font-mono">{c.tel || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-[var(--text-muted)]">{c.email || '—'}</td>
                  <td className="px-3 py-2.5"><Badge kind={TIPO_CRM_BADGE[c.tipo] || 'badge-gray'}>{c.tipo || 'Novo'}</Badge></td>
                  <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{c.origem || '—'}</td>
                  <td className="px-3 py-2.5"><span className="font-mono text-[var(--purple-neon)]">{qtdOS}</span></td>
                  <td className="px-3 py-2.5">
                    {canEdit ? (
                      <div className="flex gap-1">
                        <Button variant="secondary" size="xs" onClick={() => edit(c)}>✏</Button>
                        <Button variant="danger" size="xs" onClick={() => remover(c.id)}>✕</Button>
                      </div>
                    ) : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={7}><EmptyState icon="👥" text="Nenhum cliente" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// CLIENTE" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Nome *"><Input value={form.nome || ''} onChange={e => set('nome', e.target.value)} /></Field>
          <Field label="Telefone"><Input value={form.tel || ''} onChange={e => set('tel', e.target.value)} /></Field>
          <Field label="E-mail"><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Tipo"><Select value={form.tipo} onChange={e => set('tipo', e.target.value)}><option>Novo</option><option>Recorrente</option><option>VIP</option><option>Inadimplente</option></Select></Field>
          <Field label="Origem"><Select value={form.origem} onChange={e => set('origem', e.target.value)}><option>Instagram</option><option>Indicação</option><option>Google</option><option>Presencial</option><option>WhatsApp</option><option>Outro</option></Select></Field>
          <Field label="Endereço"><Input value={form.endereco || ''} onChange={e => set('endereco', e.target.value)} /></Field>
          <Field label="NPS (0-10)"><Input type="number" min={0} max={10} value={form.nps || ''} onChange={e => set('nps', e.target.value)} /></Field>
          <Field label="Obs / Equipamentos" span2><Textarea value={form.obs || ''} onChange={e => set('obs', e.target.value)} /></Field>
        </FormGrid>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
