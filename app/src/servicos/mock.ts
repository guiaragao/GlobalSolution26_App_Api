// Dados falsos em memória, usados enquanto a API real não está pronta.
// Têm a mesma assinatura das funções de api.ts.

import {
  Abrigo,
  DadosCadastro,
  NovaOcorrencia,
  NovoPedido,
  Ocorrencia,
  PedidoAjuda,
  RespostaLogin,
  Usuario,
} from '../modelos';
import { Coordenada, distanciaKm } from '../utils/geo';

const espera = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));
const minutosAtras = (m: number) => new Date(Date.now() - m * 60000).toISOString();

let ocorrencias: Ocorrencia[] = [
  { id: 1, tipo: 'Alagamento', descricao: 'Rua alagada, água na altura do joelho.', latitude: -23.5489, longitude: -46.6388, status: 'aberta', prioridade: 'critica', relatos: 4, bairro: 'Centro', criadaEm: minutosAtras(20) },
  { id: 2, tipo: 'Árvore caída', descricao: 'Árvore bloqueando a faixa da direita.', latitude: -23.5532, longitude: -46.6301, status: 'em_atendimento', prioridade: 'alta', relatos: 2, bairro: 'Centro', criadaEm: minutosAtras(95) },
  { id: 3, tipo: 'Sem luz', descricao: 'Poste apagado na esquina.', latitude: -23.5461, longitude: -46.6352, status: 'resolvida', prioridade: 'normal', relatos: 1, bairro: 'Centro', criadaEm: minutosAtras(600) },
];

const abrigos: Abrigo[] = [
  { id: 1, nome: 'Escola Municipal Central', endereco: 'Rua da Escola, 100', latitude: -23.5512, longitude: -46.6345, capacidade: 80, vagasOcupadas: 68 },
  { id: 2, nome: 'Ginásio do Bairro Alto', endereco: 'Av. Principal, 450', latitude: -23.5575, longitude: -46.6419, capacidade: 120, vagasOcupadas: 80 },
  { id: 3, nome: 'Igreja São José', endereco: 'Praça da Matriz, s/n', latitude: -23.5441, longitude: -46.6277, capacidade: 50, vagasOcupadas: 50 },
];

let pedidos: PedidoAjuda[] = [
  { id: 1, modo: 'pedido', categoria: 'Remédio', descricao: 'Preciso buscar um remédio para minha mãe idosa.', urgencia: 'alta', status: 'aguardando', distancia: '300 m' },
  { id: 2, modo: 'pedido', categoria: 'Transporte', descricao: 'Transporte até o abrigo para uma família.', urgencia: 'media', status: 'atendido', distancia: '500 m' },
  { id: 3, modo: 'oferta', categoria: 'Abrigo', descricao: 'Tenho dois quartos livres para receber vizinhos.', urgencia: 'baixa', status: 'aguardando', distancia: '700 m' },
];

let proximoId = 100;

export async function login(email: string, _senha: string): Promise<RespostaLogin> {
  await espera();
  const usuario: Usuario = { id: 1, nome: 'Maria Souza', email, bairro: 'Centro', perfil: 'morador' };
  return { token: 'token-falso', usuario };
}

export async function cadastrar(dados: DadosCadastro): Promise<RespostaLogin> {
  await espera();
  const usuario: Usuario = { id: proximoId++, nome: dados.nome, email: dados.email, bairro: dados.bairro, perfil: dados.perfil };
  return { token: 'token-falso', usuario };
}

export async function listarOcorrencias(): Promise<Ocorrencia[]> {
  await espera();
  return [...ocorrencias];
}

export async function criarOcorrencia(nova: NovaOcorrencia): Promise<Ocorrencia> {
  await espera();
  const o: Ocorrencia = {
    id: proximoId++,
    ...nova,
    status: 'aberta',
    prioridade: nova.tipo === 'Alagamento' ? 'alta' : 'normal',
    relatos: 1,
    bairro: 'Centro',
    criadaEm: new Date().toISOString(),
  };
  ocorrencias = [o, ...ocorrencias];
  return o;
}

export async function confirmarOcorrencia(id: number): Promise<Ocorrencia> {
  await espera(200);
  ocorrencias = ocorrencias.map((o) => (o.id === id ? { ...o, relatos: o.relatos + 1 } : o));
  return ocorrencias.find((o) => o.id === id)!;
}

export async function listarAbrigos(): Promise<Abrigo[]> {
  await espera();
  return [...abrigos];
}

export async function abrigoMaisProximo(pos: Coordenada): Promise<Abrigo | null> {
  await espera(200);
  const comVaga = abrigos.filter((a) => a.vagasOcupadas < a.capacidade);
  if (comVaga.length === 0) return null;
  return comVaga.reduce((melhor, a) => (distanciaKm(pos, a) < distanciaKm(pos, melhor) ? a : melhor));
}

export async function listarPedidos(): Promise<PedidoAjuda[]> {
  await espera();
  return [...pedidos];
}

export async function criarPedido(novo: NovoPedido): Promise<PedidoAjuda> {
  await espera();
  const p: PedidoAjuda = { id: proximoId++, ...novo, status: 'aguardando', distancia: '0 m' };
  pedidos = [p, ...pedidos];
  return p;
}

export async function enviarCheckin(status: 'estou_bem' | 'preciso_de_ajuda', _pos?: Coordenada): Promise<void> {
  await espera(200);
}
