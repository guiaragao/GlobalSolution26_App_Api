// Camada de acesso à API. As telas só importam deste arquivo.
//
// USE_MOCK = true  -> usa dados falsos (src/servicos/mock.ts), sem precisar da API.
// USE_MOCK = false -> chama a API Node.js (rotas combinadas no dia 1).
// Na integração (dia 7), troque USE_MOCK para false e ajuste BASE_URL.

import axios from 'axios';
import {
  Abrigo,
  DadosCadastro,
  NovaOcorrencia,
  NovoPedido,
  Ocorrencia,
  PedidoAjuda,
  RespostaLogin,
} from '../modelos';
import { Coordenada } from '../utils/geo';
import * as mock from './mock';

export const USE_MOCK = true;

// Use o IP do computador que roda a API (não use "localhost" no celular).
export const BASE_URL = 'http://192.168.0.10:3000';

const http = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Guarda o token JWT para as próximas chamadas.
export function definirToken(token?: string) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

export async function login(email: string, senha: string): Promise<RespostaLogin> {
  if (USE_MOCK) return mock.login(email, senha);
  return (await http.post('/auth/login', { email, senha })).data;
}

export async function cadastrar(dados: DadosCadastro): Promise<RespostaLogin> {
  if (USE_MOCK) return mock.cadastrar(dados);
  return (await http.post('/auth/cadastro', dados)).data;
}

export async function listarOcorrencias(): Promise<Ocorrencia[]> {
  if (USE_MOCK) return mock.listarOcorrencias();
  return (await http.get('/ocorrencias')).data;
}

export async function criarOcorrencia(nova: NovaOcorrencia): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.criarOcorrencia(nova);
  return (await http.post('/ocorrencias', nova)).data;
}

// Confirma "também vejo isso aqui" (soma um relato).
export async function confirmarOcorrencia(id: number): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.confirmarOcorrencia(id);
  return (await http.patch(`/ocorrencias/${id}`, { acao: 'confirmar' })).data;
}

export async function listarAbrigos(): Promise<Abrigo[]> {
  if (USE_MOCK) return mock.listarAbrigos();
  return (await http.get('/abrigos')).data;
}

export async function abrigoMaisProximo(pos: Coordenada): Promise<Abrigo | null> {
  if (USE_MOCK) return mock.abrigoMaisProximo(pos);
  return (await http.get('/abrigos/proximo', { params: { lat: pos.latitude, lng: pos.longitude } })).data;
}

export async function listarPedidos(): Promise<PedidoAjuda[]> {
  if (USE_MOCK) return mock.listarPedidos();
  return (await http.get('/ajuda')).data;
}

export async function criarPedido(novo: NovoPedido): Promise<PedidoAjuda> {
  if (USE_MOCK) return mock.criarPedido(novo);
  return (await http.post('/ajuda', novo)).data;
}

export async function enviarCheckin(status: 'estou_bem' | 'preciso_de_ajuda', pos?: Coordenada): Promise<void> {
  if (USE_MOCK) return mock.enviarCheckin(status, pos);
  await http.post('/checkins', { status, latitude: pos?.latitude, longitude: pos?.longitude });
}
