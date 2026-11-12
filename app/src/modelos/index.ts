// Modelos de dados (espelham as tabelas do banco).

export type StatusOcorrencia = 'aberta' | 'em_atendimento' | 'resolvida';
export type Prioridade = 'normal' | 'alta' | 'critica';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  bairro: string;
  perfil: 'morador' | 'idoso' | 'voluntario';
}

export interface Ocorrencia {
  id: number;
  tipo: string; // alagamento, árvore caída, falta de luz...
  descricao: string;
  latitude: number;
  longitude: number;
  status: StatusOcorrencia;
  prioridade: Prioridade;
  relatos: number;
  bairro: string;
  fotoUri?: string;
  criadaEm: string; // ISO
}

export interface NovaOcorrencia {
  tipo: string;
  descricao: string;
  latitude: number;
  longitude: number;
  fotoUri?: string;
}

export interface Abrigo {
  id: number;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  capacidade: number;
  vagasOcupadas: number;
}

export type ModoAjuda = 'pedido' | 'oferta';
export type StatusPedido = 'aguardando' | 'atendido';

export interface PedidoAjuda {
  id: number;
  modo: ModoAjuda;
  categoria: string; // remédio, transporte, abrigo, outros
  descricao: string;
  urgencia: 'baixa' | 'media' | 'alta';
  status: StatusPedido;
  distancia: string;
}

export interface NovoPedido {
  modo: ModoAjuda;
  categoria: string;
  descricao: string;
  urgencia: 'baixa' | 'media' | 'alta';
}

export interface DadosCadastro {
  nome: string;
  email: string;
  bairro: string;
  senha: string;
  perfil: Usuario['perfil'];
}

export interface RespostaLogin {
  token: string;
  usuario: Usuario;
}
