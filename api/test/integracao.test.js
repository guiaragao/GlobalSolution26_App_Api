// Teste de integração: percorre as rotas na mesma ordem em que o app as usa.
//
// Sem variável de ambiente  -> sobe a API com um repositório em memória.
// API_URL=http://host:3000  -> roda contra a API real (com Oracle e rotinas da Pessoa 4).

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { subirApi, cliente } = require('./apoio');

let api;
let http;

before(async () => {
  api = process.env.API_URL ? { url: process.env.API_URL, fechar() {} } : await subirApi();
  http = cliente(api.url);
});
after(() => api.fechar());

test('fluxo completo do app: cadastro -> login -> ocorrências -> abrigos -> ajuda -> check-in -> indicadores', async (t) => {
  const email = `teste.${Date.now()}@alertabairro.com`;
  const senha = 'senhaForte123';

  await t.test('POST /auth/cadastro cria usuário e devolve token', async () => {
    const r = await http.post('/auth/cadastro', { nome: 'Teste Integração', email, bairro: 'Centro', senha, perfil: 'morador' });
    assert.equal(r.status, 201);
    assert.ok(r.body.token);
    assert.equal(r.body.usuario.email, email);
    assert.equal(r.body.usuario.senhaHash, undefined);
  });

  await t.test('POST /auth/login devolve { token, usuario }', async () => {
    const r = await http.post('/auth/login', { email, senha });
    assert.equal(r.status, 200);
    assert.equal(r.body.usuario.perfil, 'morador');
    http.definirToken(r.body.token);
  });

  let ocorrencia;
  await t.test('POST /ocorrencias registra pela procedure e devolve a ocorrência', async () => {
    const r = await http.post('/ocorrencias', { tipo: 'Árvore caída', descricao: 'Bloqueando a rua.', latitude: -23.55, longitude: -46.63 });
    assert.equal(r.status, 201);
    ocorrencia = r.body;
    assert.equal(ocorrencia.status, 'aberta');
    assert.ok(ocorrencia.relatos >= 1);
    assert.ok(['normal', 'alta', 'critica'].includes(ocorrencia.prioridade));
  });

  await t.test('GET /ocorrencias lista a nova ocorrência', async () => {
    const r = await http.get('/ocorrencias');
    assert.equal(r.status, 200);
    assert.ok(r.body.some((o) => o.id === ocorrencia.id));
  });

  await t.test('PATCH /ocorrencias/:id { acao: confirmar } soma um relato', async () => {
    const r = await http.patch(`/ocorrencias/${ocorrencia.id}`, { acao: 'confirmar' });
    assert.equal(r.status, 200);
    assert.equal(r.body.relatos, ocorrencia.relatos + 1);
  });

  await t.test('GET /abrigos e GET /abrigos/proximo', async () => {
    const lista = await http.get('/abrigos');
    assert.equal(lista.status, 200);
    assert.ok(Array.isArray(lista.body));
    const prox = await http.get('/abrigos/proximo?lat=-23.55&lng=-46.63');
    assert.equal(prox.status, 200);
    if (prox.body !== null) assert.ok(prox.body.vagasOcupadas < prox.body.capacidade);
  });

  await t.test('POST /checkins registra "estou bem"', async () => {
    const r = await http.post('/checkins', { status: 'estou_bem', latitude: -23.55, longitude: -46.63 });
    assert.equal(r.status, 201);
  });

  let pedido;
  await t.test('POST /ajuda cria pedido aguardando', async () => {
    const r = await http.post('/ajuda', { modo: 'pedido', categoria: 'Transporte', descricao: 'Levar família ao abrigo.', urgencia: 'media' });
    assert.equal(r.status, 201);
    pedido = r.body;
    assert.equal(pedido.status, 'aguardando');
    assert.equal(typeof pedido.distancia, 'string');
  });

  await t.test('GET /ajuda lista pedidos com distância e sem coordenadas', async () => {
    const r = await http.get('/ajuda');
    assert.equal(r.status, 200);
    const meu = r.body.find((p) => p.id === pedido.id);
    assert.ok(meu);
    assert.match(meu.distancia, /m$/);
    assert.equal(meu.latitude, undefined);
  });

  await t.test('GET /indicadores devolve números', async () => {
    const r = await http.get('/indicadores');
    assert.equal(r.status, 200);
    for (const campo of ['ocorrenciasAbertas', 'capacidadeAbrigos', 'vagasOcupadas', 'pedidosAguardando', 'checkinsEstouBem24h']) {
      assert.equal(typeof r.body[campo], 'number', campo);
    }
  });
});
