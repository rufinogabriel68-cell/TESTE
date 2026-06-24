export function fmt(val: string | number | undefined): string {
  return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export function fmtDate(d?: string): string {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const dt = new Date(clean + 'T00:00:00');
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('pt-BR');
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function diasRestantes(dataServico: string, prazo: string | number): number {
  if (!dataServico) return 0;
  const inicio = new Date(dataServico + 'T00:00:00');
  const venc = new Date(inicio);
  venc.setDate(venc.getDate() + Number(prazo || 90));
  return Math.ceil((venc.getTime() - Date.now()) / 86400000);
}

export function nextNum(items: { num?: number }[]): number {
  return Math.max(0, ...items.map(i => i.num || 0)) + 1;
}

export const STATUS_BADGE: Record<string, string> = {
  'Aguardando': 'badge-yellow', 'Em andamento': 'badge-cyan',
  'Concluído': 'badge-green', 'Cancelado': 'badge-red',
  'Aprovado': 'badge-green', 'Recusado': 'badge-red',
  'Novo': 'badge-red', 'Em análise': 'badge-yellow', 'Resolvido': 'badge-green',
  'Confirmado': 'badge-green',
};

export const PRIORIDADE_BADGE: Record<string, string> = {
  'Normal': 'badge-gray', 'Alta': 'badge-yellow', 'Urgente': 'badge-red',
};

export const TIPO_CRM_BADGE: Record<string, string> = {
  'Novo': 'badge-cyan', 'Recorrente': 'badge-purple', 'VIP': 'badge-green', 'Inadimplente': 'badge-red',
};
