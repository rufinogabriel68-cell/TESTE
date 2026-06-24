export interface OS {
  id: string;
  num: number;
  cliente: string;
  tel: string;
  descricao: string;
  status: string;
  prioridade: string;
  valor: string;
  previsao: string;
  obs: string;
  createdAt: string;
  updatedAt: string;
}

export interface Orcamento {
  id: string;
  num: number;
  cliente: string;
  descricao: string;
  valor: string;
  lucro: string;
  status: string;
  validade: string;
  obs: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  tel: string;
  email: string;
  tipo: string;
  origem: string;
  endereco: string;
  nps: string;
  obs: string;
  createdAt: string;
}

export interface Garantia {
  id: string;
  cliente: string;
  servico: string;
  data: string;
  prazo: string | number;
  obs: string;
  createdAt: string;
}

export interface Depoimento {
  id: string;
  cliente: string;
  nota: string | number;
  texto: string;
  createdAt: string;
}

export interface EstoqueItem {
  id: string;
  nome: string;
  categoria: string;
  qty: number;
  min: number;
  custo: string;
  local: string;
  fornecedor: string;
  createdAt: string;
}

export interface Evento {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  status: string;
  obs: string;
  createdAt: string;
}

export interface Nota {
  id: string;
  titulo: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export interface Servico {
  id: string;
  nome: string;
  categoria: string;
  preco: string;
  duracao: string;
  desc: string;
  createdAt: string;
}

export interface Chamado {
  id: string;
  num: number;
  nome: string;
  contato: string;
  problema: string;
  status: string;
  createdAt: string;
}

export interface Movimento {
  id: string;
  desc: string;
  valor: string;
  data: string;
  cat: string;
  createdAt: string;
}

export interface Config {
  nome: string;
  cnpj: string;
  tel: string;
  cidade: string;
  metaMes: string | number;
  metaAno: string | number;
}

export interface DB {
  os: OS[];
  orcamentos: Orcamento[];
  clientes: Cliente[];
  garantias: Garantia[];
  depoimentos: Depoimento[];
  estoque: EstoqueItem[];
  agenda: Evento[];
  notas: Nota[];
  catalogo: Servico[];
  financeiro: { receitas: Movimento[]; despesas: Movimento[] };
  chamados: Chamado[];
  config: Config;
}

export function emptyDB(): DB {
  return {
    os: [], orcamentos: [], clientes: [], garantias: [],
    depoimentos: [], estoque: [], agenda: [], notas: [],
    catalogo: [], financeiro: { receitas: [], despesas: [] },
    chamados: [],
    config: { nome: 'GBR Soluções', cnpj: '', tel: '', cidade: 'Arujá, SP', metaMes: 5000, metaAno: 60000 },
  };
}

export type ModuleName =
  | 'dashboard' | 'os' | 'orcamentos' | 'chamados' | 'crm' | 'garantias'
  | 'depoimentos' | 'estoque' | 'financeiro' | 'agenda' | 'catalogo'
  | 'notas' | 'config';

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
