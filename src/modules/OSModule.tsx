import { useEffect, useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type OS, type Chamado } from '../types';
import { fmt, fmtDate, nextNum, STATUS_BADGE, PRIORIDADE_BADGE } from '../lib/helpers';
import {
  SectionHeader, Card, Badge, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea, Select,
} from '../components/ui';

const blank = (): Partial<OS> => ({ status: 'Aguardando', prioridade: 'Normal' });

export default function OSModule({ prefill }: { prefill?: Chamado | null }) {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<OS>>(blank());

  useEffect(() => {
    if (prefill && canEdit) {
      setForm({ status: 'Aguardando', prioridade: 'Normal', cliente: prefill.nome, tel: prefill.contato, descricao: prefill.problema });
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.id]);

  const set = (k: keyof OS, v: any) => setForm(f => ({ ...f, [k]: v }));

  let list = [...db.os].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (search) list = list.filter(o => (o.cliente || '').toLowerCase().includes(search.toLowerCase()) || (o.descricao || '').toLowerCase().includes(search.toLowerCase()));
  if (filter) list = list.filter(o => o.status === filter);

  const novo = () => { if (!guardEdit()) return; setForm(blank()); setOpen(true); };
  const edit = (o: OS) => { if (!guardEdit()) return; setForm(o); setOpen(true); };

  const salvar = () => {
    if (!form.cliente?.trim()) { toast('Informe o cliente!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.os.find(o => o.id === id);
      const num = existing ? existing.num : nextNum(prev.os);
      const rec: OS = {
        id, num,
        cliente: form.cliente!.trim(), tel: form.tel || '', descricao: form.descricao || '',
        status: form.status || 'Aguardando', prioridade: form.prioridade || 'Normal',
        valor: form.valor || '', previsao: form.previsao || '', obs: form.obs || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const clientes = [...prev.clientes];
      if (rec.cliente && !clientes.find(c => c.nome.toLowerCase() === rec.cliente.toLowerCase())) {
        clientes.push({ id: genId(), nome: rec.cliente, tel: rec.tel, email: '', tipo: 'Novo', origem: 'OS', endereco: '', nps: '', obs: '', createdAt: new Date().toISOString() });
      }
      const os = existing ? prev.os.map(o => o.id === id ? rec : o) : [...prev.os, rec];
      return { ...prev, os, clientes };
    });
    setOpen(false);
    toast('OS salva!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir esta OS?')) return;
    mutate(prev => ({ ...prev, os: prev.os.filter(o => o.id !== id) }));
    toast('OS excluída', 'warn');
  };

  const avancar = (o: OS) => {
    if (!guardEdit()) return;
    const flow = ['Aguardando', 'Em andamento', 'Concluído'];
    const i = flow.indexOf(o.status);
    if (i < flow.length - 1) {
      mutate(prev => ({ ...prev, os: prev.os.map(x => x.id === o.id ? { ...x, status: flow[i + 1], updatedAt: new Date().toISOString() } : x) }));
      toast(`OS avançada para "${flow[i + 1]}"`, 'success');
    }
  };

  return (
    <div>
      <SectionHeader title="Ordens de Serviço" count={db.os.length}>
        <div className="relative max-w-[260px]">
          <Input placeholder="🔍 Buscar OS..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todos os Status</option>
          <option>Aguardando</option><option>Em andamento</option><option>Concluído</option><option>Cancelado</option>
        </Select>
        {canEdit && <Button onClick={novo}>+ Nova OS</Button>}
      </SectionHeader>

      <Card noPad>
        <TableWrap>
          <thead><tr><Th>#</Th><Th>Cliente</Th><Th>Serviço</Th><Th>Status</Th><Th>Prioridade</Th><Th>Valor</Th><Th>Data</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {list.length ? list.map(o => (
              <tr key={o.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                <td className="px-3 py-2.5 text-[13px]"><span className="font-mono text-[var(--purple-neon)]">#{String(o.num || 0).padStart(3, '0')}</span></td>
                <td className="px-3 py-2.5 text-[13px]"><strong>{o.cliente || '—'}</strong><br /><small className="text-[var(--text-muted)]">{o.tel}</small></td>
                <td className="px-3 py-2.5 text-[13px] max-w-[200px]">{(o.descricao || '').slice(0, 60)}{(o.descricao || '').length > 60 ? '...' : ''}</td>
                <td className="px-3 py-2.5"><Badge kind={STATUS_BADGE[o.status] || 'badge-gray'}>{o.status}</Badge></td>
                <td className="px-3 py-2.5"><Badge kind={PRIORIDADE_BADGE[o.prioridade] || 'badge-gray'}>{o.prioridade || 'Normal'}</Badge></td>
                <td className="px-3 py-2.5 text-[13px] font-mono">{fmt(o.valor)}</td>
                <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{fmtDate(o.createdAt)}</td>
                <td className="px-3 py-2.5">
                  {canEdit ? (
                    <div className="flex gap-1">
                      <Button variant="secondary" size="xs" onClick={() => edit(o)}>✏</Button>
                      <Button variant="danger" size="xs" onClick={() => remover(o.id)}>✕</Button>
                      {o.status !== 'Concluído' && <Button size="xs" onClick={() => avancar(o)}>▶</Button>}
                    </div>
                  ) : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}
                </td>
              </tr>
            )) : <tr><td colSpan={8}><EmptyState icon="🔧" text="Nenhuma OS encontrada" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// ORDEM DE SERVIÇO" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Cliente"><Input value={form.cliente || ''} onChange={e => set('cliente', e.target.value)} list="clientes-list" /></Field>
          <Field label="Telefone"><Input value={form.tel || ''} onChange={e => set('tel', e.target.value)} /></Field>
          <Field label="Descrição do Serviço" span2><Textarea value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} /></Field>
          <Field label="Status"><Select value={form.status} onChange={e => set('status', e.target.value)}><option>Aguardando</option><option>Em andamento</option><option>Concluído</option><option>Cancelado</option></Select></Field>
          <Field label="Prioridade"><Select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}><option>Normal</option><option>Alta</option><option>Urgente</option></Select></Field>
          <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor || ''} onChange={e => set('valor', e.target.value)} /></Field>
          <Field label="Previsão"><Input type="date" value={form.previsao || ''} onChange={e => set('previsao', e.target.value)} /></Field>
          <Field label="Observações" span2><Textarea value={form.obs || ''} onChange={e => set('obs', e.target.value)} /></Field>
        </FormGrid>
        <datalist id="clientes-list">{db.clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar OS</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
