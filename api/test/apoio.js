// Utilitários de teste: repositório em memória (mesma interface de src/repositorio.js)
// e um servidor da API em porta aleatória.

const criarApp = require('../src/app');

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';

function criarRepoFalso() {
  let seq = 100;
  const usuarios = [];
  const checkins = [];
  const ocorrencias = [
    { id: 1, tipo: 'Alagamento', descricao: 'Rua alagada.', latitude: -23.5489, longitude: -46.6388, status: 'aberta', prioridade: 'alta', relatos: 2, bairro: 'Centro', fotoUri: null, criadaEm: new Date() },
  ];
  const abrigos = [
    { id: 1, nome: 'Escola Central', endereco: 'Rua da Escola, 100', latitude: -23.5512, longitude: -46.6345, capacidade: 80, vagasOcupadas: 68 },
    { id: 2, nome: 'Igreja São José', endereco: 'Praça da Matriz', latitude: -23.5441, longitude: -46.6277, capacidade: 50, vagasOcupadas: 50 },
  ];
  const pedidos = [
    { id: 1, idUsuario: 0, modo: 'pedido', categoria: 'Remédio', descricao: 'Remédio para idosa.', urgencia: 'alta', status: 'aguardando', latitude: -23.5489, longitude: -46.6388 },
  ];
  const semUsuario = ({ idUsuario, ...resto }) => resto;

  return {
    async buscarUsuarioPorEmail(email) { return usuarios.find((u) => u.email === email); },
    async criarUsuario(u) {
      if (usuarios.some((x) => x.email === u.email)) throw Object.assign(new Error('ORA-00001: unique constraint violated'), { errorNum: 1 });
      const novo = { id: ++seq, ...u };
      usuarios.push(novo);
      const { senhaHash, ...publico } = novo;
      return publico;
    },
    async listarOcorrencias() { return [...ocorrencias]; },
    async registrarOcorrencia(idUsuario, n) {
      const o = { id: ++seq, ...n, status: 'aberta', prioridade: 'normal', relatos: 1, bairro: 'Centro', criadaEm: new Date() };
      ocorrencias.unshift(o);
      return o;
    },
    async confirmarOcorrencia(id) {
      const o = ocorrencias.find((x) => x.id === id);
      if (o) o.relatos += 1;
      return o;
    },
    async alterarStatusOcorrencia(id, status) {
      const o = ocorrencias.find((x) => x.id === id);
      if (o) o.status = status;
      return o;
    },
    async listarAbrigos() { return [...abrigos]; },
    async abrigoMaisProximo() { return abrigos.find((a) => a.vagasOcupadas < a.capacidade) ?? null; },
    async controlarVagas(id, quantidade) {
      const a = abrigos.find((x) => x.id === id);
      if (!a) return undefined;
      if (a.vagasOcupadas + quantidade > a.capacidade) throw Object.assign(new Error('ORA-20002: Abrigo sem vagas suficientes\nORA-06512: at line 1'), { errorNum: 20002 });
      a.vagasOcupadas += quantidade;
      return a;
    },
    async listarPedidos() { return pedidos.map(semUsuario); },
    async criarPedido(idUsuario, n) {
      const p = { id: ++seq, idUsuario, ...n, status: 'aguardando' };
      pedidos.unshift(p);
      return semUsuario(p);
    },
    async encerrarPedidosAntigos() { return 3; },
    async registrarCheckin(idUsuario, c) {
      const ck = { id: ++seq, idUsuario, ...c };
      checkins.push(ck);
      return ck.id;
    },
    async ultimaPosicao(idUsuario) {
      const ck = checkins.filter((c) => c.idUsuario === idUsuario && c.latitude != null).at(-1);
      return ck && { latitude: ck.latitude, longitude: ck.longitude };
    },
    async indicadores() {
      return { ocorrenciasAbertas: 1, ocorrenciasEmAtendimento: 0, ocorrenciasResolvidas: 0, ocorrenciasCriticas: 0, capacidadeAbrigos: 130, vagasOcupadas: 118, ocupacaoAbrigosPct: 90.8, pedidosAguardando: 1, pedidosAtendidos: 0, checkinsEstouBem24h: 0, checkinsPrecisoAjuda24h: 0 };
    },
  };
}

// Sobe a API em porta livre e devolve { url, fechar }.
async function subirApi(repo = criarRepoFalso()) {
  const app = criarApp({ repo, segredo: SEGREDO });
  const server = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)); });
  return { url: `http://127.0.0.1:${server.address().port}`, repo, fechar: () => server.close() };
}

// Cliente HTTP mínimo (fetch nativo), no formato { status, body }.
function cliente(url) {
  let token;
  const chamar = async (metodo, rota, corpo) => {
    const r = await fetch(url + rota, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    const texto = await r.text();
    return { status: r.status, body: texto ? JSON.parse(texto) : undefined };
  };
  return {
    definirToken: (t) => { token = t; },
    get: (rota) => chamar('GET', rota),
    post: (rota, corpo) => chamar('POST', rota, corpo),
    patch: (rota, corpo) => chamar('PATCH', rota, corpo),
  };
}

module.exports = { SEGREDO, criarRepoFalso, subirApi, cliente };
