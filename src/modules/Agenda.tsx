import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { genId, type Evento } from '../types';
import { fmtDate, todayStr, STATUS_BADGE } from '../lib/helpers';
import {
  Card, CardHeader, Badge, Button, EmptyState, TableWrap, Th,
  Modal, Field, FormGrid, FormActions, Input, Textarea, Select,
} from '../components/ui';

export default function Agenda() {
  const { db, mutate, toast, guardEdit, canEdit } = useApp();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Evento>>({});
  const set = (k: keyof Evento, v: any) => setForm(f => ({ ...f, [k]: v }));

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const nav = (dir: number) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y);
  };

  const novoData = (date: string) => {
    if (!guardEdit()) return;
    setForm({ data: date, tipo: 'Visita', status: 'Confirmado' });
    setOpen(true);
  };
  const edit = (e: Evento) => { if (!guardEdit()) return; setForm(e); setOpen(true); };

  const salvar = () => {
    if (!form.titulo?.trim() || !form.data) { toast('Preencha título e data!', 'error'); return; }
    mutate(prev => {
      const id = form.id || genId();
      const existing = prev.agenda.find(e => e.id === id);
      const rec: Evento = {
        id, titulo: form.titulo!.trim(), data: form.data!, hora: form.hora || '',
        tipo: form.tipo || 'Visita', status: form.status || 'Confirmado', obs: form.obs || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return { ...prev, agenda: existing ? prev.agenda.map(e => e.id === id ? rec : e) : [...prev.agenda, rec] };
    });
    setOpen(false);
    toast('Evento salvo!', 'success');
  };

  const remover = (id: string) => {
    if (!guardEdit()) return;
    if (!confirm('Excluir evento?')) return;
    mutate(prev => ({ ...prev, agenda: prev.agenda.filter(e => e.id !== id) }));
  };

  const hoje = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const upcoming = db.agenda.filter(e => e.data >= todayStr()).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5">
        <div className="text-lg font-extrabold">Agenda <span className="text-[11px] text-[var(--purple-neon)] font-mono font-normal ml-2">{meses[month]} {year}</span></div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => nav(-1)}>◀</Button>
          <Button variant="secondary" size="sm" onClick={() => nav(1)}>▶</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-center text-[10px] font-mono text-[var(--text-muted)] py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = hoje.getDate() === d && hoje.getMonth() === month && hoje.getFullYear() === year;
            const evs = db.agenda.filter(e => e.data === dateStr);
            return (
              <div key={i} onClick={() => novoData(dateStr)}
                className={`bg-[var(--bg-card)] border rounded-md p-1.5 min-h-[70px] cursor-pointer transition-all hover:border-[var(--purple-mid)] ${isToday ? 'border-[var(--purple-neon)]' : 'border-[var(--border)]'}`}>
                <div className={`text-[11px] font-mono mb-1 ${isToday ? 'text-[var(--purple-neon)] font-bold' : 'text-[var(--text-muted)]'}`}>{d}</div>
                {evs.slice(0, 2).map(e => <div key={e.id} className="text-[9px] px-1 py-0.5 bg-[rgba(74,0,224,0.3)] rounded text-[var(--purple-glow)] mb-0.5 truncate">{e.titulo}</div>)}
                {evs.length > 2 && <div className="text-[8px] text-[var(--text-muted)]">+{evs.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="📅 Próximos Eventos" />
        <TableWrap>
          <thead><tr><Th>Evento</Th><Th>Data/Hora</Th><Th>Tipo</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {upcoming.length ? upcoming.map(e => (
              <tr key={e.id} className="hover:bg-[var(--bg-hover)] border-b border-[rgba(30,30,58,0.5)]">
                <td className="px-3 py-2.5 text-[13px]"><strong>{e.titulo}</strong><br /><small className="text-[var(--text-muted)]">{e.obs}</small></td>
                <td className="px-3 py-2.5 font-mono text-xs">{fmtDate(e.data)} {e.hora}</td>
                <td className="px-3 py-2.5"><Badge kind="badge-purple">{e.tipo || 'Outro'}</Badge></td>
                <td className="px-3 py-2.5"><Badge kind={STATUS_BADGE[e.status] || 'badge-gray'}>{e.status}</Badge></td>
                <td className="px-3 py-2.5">
                  {canEdit ? (
                    <div className="flex gap-1">
                      <Button variant="secondary" size="xs" onClick={() => edit(e)}>✏</Button>
                      <Button variant="danger" size="xs" onClick={() => remover(e.id)}>✕</Button>
                    </div>
                  ) : <span className="text-[var(--text-muted)] text-[11px]">🔒</span>}
                </td>
              </tr>
            )) : <tr><td colSpan={5}><EmptyState icon="📅" text="Nenhum evento futuro" /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <Modal title="// EVENTO" open={open} onClose={() => setOpen(false)}>
        <FormGrid>
          <Field label="Título" span2><Input value={form.titulo || ''} onChange={e => set('titulo', e.target.value)} /></Field>
          <Field label="Data"><Input type="date" value={form.data || ''} onChange={e => set('data', e.target.value)} /></Field>
          <Field label="Hora"><Input type="time" value={form.hora || ''} onChange={e => set('hora', e.target.value)} /></Field>
          <Field label="Tipo"><Select value={form.tipo} onChange={e => set('tipo', e.target.value)}><option>Visita</option><option>Instalação</option><option>Manutenção</option><option>Reunião</option><option>Outro</option></Select></Field>
          <Field label="Status"><Select value={form.status} onChange={e => set('status', e.target.value)}><option>Confirmado</option><option>Aguardando</option><option>Cancelado</option></Select></Field>
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
