import { useState } from 'react';
import jsPDF from 'jspdf';
import { useApp } from '../lib/AppContext';
import { genId, type Orcamento } from '../types';
import { fmt, fmtDate, nextNum, STATUS_BADGE } from '../lib/helpers';
import {
  SectionHeader, Card, Badge, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea, Select,
} from '../components/ui';

const blank = (): Partial<Orcamento> => ({ status: 'Aguardando' });

export default function Orcamentos() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Orcamento>>(blank());
  const set = (k: keyof Orcamento, v: any) => setForm(f => ({ ...f, [k]: v }));

  const list = [...db.orcamentos].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const novo = () => { if (!guardEdit()) return; setForm(blank()); setOpen(true); };
  const edit = (o: Orcamento) => { if (!guardEdit()) return; setForm(o); setOpen(true); };

  const salvar = () => {
    if (!form.cliente?.trim()) { toast('Informe o cliente!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.orcamentos.find(o => o.id === id);
      const num = existing ? existing.num : nextNum(prev.orcamentos);
      const rec: Orcamento = {
        id, num, cliente: form.cliente!.trim(), descricao: form.descricao || '',
        valor: form.valor || '', lucro: form.lucro || '', status: form.status || 'Aguardando',
        validade: form.validade || '', obs: form.obs || '',
        createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      return { ...prev, orcamentos: existing ? prev.orcamentos.map(o => o.id === id ? rec : o) : [...prev.orcamentos, rec] };
    });
    setOpen(false);
    toast('Orçamento salvo!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir?')) return;
    mutate(prev => ({ ...prev, orcamentos: prev.orcamentos.filter(o => o.id !== id) }));
    toast('Excluído', 'warn');
  };

  const gerarPDF = (o: Partial<Orcamento>) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(10, 10, 15); doc.rect(0, 0, 210, 297, 'F');
      doc.setTextColor(162, 85, 247); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text('GBR Soluções', 20, 30);
      doc.setFontSize(10); doc.setTextColor(139, 125, 181); doc.setFont('helvetica', 'normal');
      doc.text('Sobrinho de Aluguel — ' + (db.config.cidade || 'Arujá, SP'), 20, 38);
      doc.setDrawColor(74, 0, 224); doc.line(20, 42, 190, 42);
      doc.setTextColor(226, 217, 243); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('ORÇAMENTO', 20, 55);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Cliente: ' + (o.cliente || '—'), 20, 68);
      doc.text('Data: ' + new Date().toLocaleDateString('pt-BR'), 20, 76);
      doc.setDrawColor(30, 30, 58); doc.line(20, 82, 190, 82);
      doc.setTextColor(162, 85, 247); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('DESCRIÇÃO', 20, 92);
      doc.setTextColor(226, 217, 243); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const lines = doc.splitTextToSize(o.descricao || '—', 170);
      doc.text(lines, 20, 100);
      const y = 100 + lines.length * 6;
      if (o.obs) { doc.setTextColor(139, 125, 181); doc.text('Obs: ' + o.obs, 20, y + 10); }
      doc.setDrawColor(74, 0, 224); doc.line(20, y + 20, 190, y + 20);
      doc.setTextColor(162, 85, 247); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('TOTAL: ' + fmt(o.valor), 20, y + 32);
      doc.setTextColor(139, 125, 181); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('GBR Soluções — ' + (db.config.tel || ''), 20, 280);
      doc.save(`orcamento-${o.cliente || 'gbr'}-${Date.now()}.pdf`);
      toast('PDF gerado!', 'success');
    } catch (e: any) { toast('Erro ao gerar PDF: ' + e.message, 'error'); }
  };

  return (
    <div>
      <SectionHeader title="Orçamentos" count={list.length}>
        {canEdit && <Button onClick={novo}>+ Novo Orçamento</Button>}
      </SectionHeader>
      <Card noPad>
        <TableWrap>
          <thead><tr><Th>#</Th><Th>Cliente</Th><Th>Descrição</Th><Th>Valor</Th><Th>Status</Th><Th>Validade</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {list.length ? list.map(o => (
              <tr key={o.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                <td className="px-3 py-2.5 text-[13px]"><span className="font-mono text-[var(--purple-neon)]">#{String(o.num || 0).padStart(3, '0')}</span></td>
                <td className="px-3 py-2.5 text-[13px]">{o.cliente}</td>
                <td className="px-3 py-2.5 text-[13px] max-w-[160px]">{(o.descricao || '').slice(0, 50)}...</td>
                <td className="px-3 py-2.5 text-[13px] font-mono">{fmt(o.valor)}</td>
                <td className="px-3 py-2.5"><Badge kind={STATUS_BADGE[o.status] || 'badge-gray'}>{o.status}</Badge></td>
                <td className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">{fmtDate(o.validade)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    {canEdit && <Button variant="secondary" size="xs" onClick={() => edit(o)}>✏</Button>}
                    {canEdit && <Button variant="danger" size="xs" onClick={() => remover(o.id)}>✕</Button>}
                    <Button variant="secondary" size="xs" onClick={() => gerarPDF(o)}>📄</Button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={7}><EmptyState icon="📋" text="Nenhum orçamento" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// ORÇAMENTO" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Cliente"><Input value={form.cliente || ''} onChange={e => set('cliente', e.target.value)} list="clientes-list-orc" /></Field>
          <Field label="Validade"><Input type="date" value={form.validade || ''} onChange={e => set('validade', e.target.value)} /></Field>
          <Field label="Descrição" span2><Textarea value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} /></Field>
          <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor || ''} onChange={e => set('valor', e.target.value)} /></Field>
          <Field label="Lucro Estimado (%)"><Input type="number" value={form.lucro || ''} onChange={e => set('lucro', e.target.value)} /></Field>
          <Field label="Status"><Select value={form.status} onChange={e => set('status', e.target.value)}><option>Aguardando</option><option>Aprovado</option><option>Recusado</option></Select></Field>
          <Field label="Observações" span2><Textarea value={form.obs || ''} onChange={e => set('obs', e.target.value)} /></Field>
        </FormGrid>
        <datalist id="clientes-list-orc">{db.clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
        <FormActions>
          <Button onClick={salvar}>💾 Salvar</Button>
          <Button variant="secondary" onClick={() => gerarPDF(form)}>📄 PDF</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
        </FormActions>
      </Modal>
    </div>
  );
}
