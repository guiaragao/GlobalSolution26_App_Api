// Regras da API: segurança, validação, permissões e tradução de erros do Oracle.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { subirApi, cliente } = require('./apoio');

let api;
before(async () => { api = await subirApi(); });
after(() => api.fechar());

async function entrar(perfil = 'morador') {
  const http = cliente(api.url);
  const r = await http.post('/auth/cadastro', { nome: 'Fulano', email: `${perfil}.${Math.random()}@x.com`, bairro: 'Centro', senha: 'segredo1', perfil });
  http.definirToken(r.body.token);
  return http;
}

test('senha é guardada com bcrypt, nunca em texto puro', async () => {
  const http = cliente(api.url);
  await http.post('/auth/cadastro', { nome: 'Ana', email: 'ANA@x.com ', bairro: 'Centro', senha: 'minhasenha', perfil: 'idoso' });
  const u = await api.repo.buscarUsuarioPorEmail('ana@x.com');
  assert.ok(u, 'e-mail deve ser normalizado (trim + minúsculas)');
  assert.notEqual(u.senhaHash, 'minhasenha');
  assert.match(u.senhaHash, /^\$2[aby]\$10\$/);
});

test('cadastro: e-mail repetido -> 409; perfil inválido -> 400; senha curta -> 400', async () => {
  const http = cliente(api.url);
  const dados = { nome: 'Bia', email: 'bia@x.com', bairro: 'Centro', senha: 'segredo1', perfil: 'morador' };
  assert.equal((await http.post('/auth/cadastro', dados)).status, 201);
  assert.equal((await http.post('/auth/cadastro', dados)).status, 409);
  assert.equal((await http.post('/auth/cadastro', { ...dados, email: 'c@x.com', perfil: 'admin' })).status, 400);
  assert.equal((await http.post('/auth/cadastro', { ...dados, email: 'd@x.com', senha: '123' })).status, 400);
});

test('login: senha errada e e-mail inexistente -> 401 com a mesma mensagem', async () => {
  const http = cliente(api.url);
  await http.post('/auth/cadastro', { nome: 'Caio', email: 'caio@x.com', bairro: 'Centro', senha: 'certa123', perfil: 'morador' });
  const errada = await http.post('/auth/login', { email: 'caio@x.com', senha: 'errada123' });
  const inexistente = await http.post('/auth/login', { email: 'ninguem@x.com', senha: 'certa123' });
  assert.equal(errada.status, 401);
  assert.equal(inexistente.status, 401);
  assert.equal(errada.body.erro, inexistente.body.erro);
});

test('token JWT: válido por 8h, com id e perfil', async () => {
  const http = cliente(api.url);
  const r = await http.post('/auth/cadastro', { nome: 'Davi', email: 'davi@x.com', bairro: 'Centro', senha: 'segredo1', perfil: 'voluntario' });
  const p = jwt.decode(r.body.token);
  assert.equal(p.sub, String(r.body.usuario.id));
  assert.equal(p.perfil, 'voluntario');
  assert.equal(p.exp - p.iat, 8 * 3600);
});

test('rotas protegidas: sem token, token adulterado ou expirado -> 401', async () => {
  const http = cliente(api.url);
  assert.equal((await http.get('/ocorrencias')).status, 401);
  http.definirToken(jwt.sign({ sub: '1', perfil: 'voluntario' }, 'outro-segredo'));
  assert.equal((await http.get('/ocorrencias')).status, 401);
  http.definirToken(jwt.sign({ sub: '1', perfil: 'morador', exp: Math.floor(Date.now() / 1000) - 10 }, require('./apoio').SEGREDO));
  assert.equal((await http.get('/ocorrencias')).status, 401);
});

test('GET /health é público', async () => {
  const r = await cliente(api.url).get('/health');
  assert.equal(r.status, 200);
});

test('validação: coordenadas fora do intervalo e acao desconhecida -> 400; id inexistente -> 404', async () => {
  const http = await entrar();
  assert.equal((await http.post('/ocorrencias', { tipo: 'X', descricao: 'Y', latitude: 200, longitude: 0 })).status, 400);
  assert.equal((await http.get('/abrigos/proximo?lat=&lng=-46')).status, 400);
  assert.equal((await http.patch('/ocorrencias/1', { acao: 'apagar' })).status, 400);
  assert.equal((await http.patch('/ocorrencias/999999', { acao: 'confirmar' })).status, 404);
  assert.equal((await http.post('/checkins', { status: 'talvez' })).status, 400);
  assert.equal((await http.post('/ajuda', { modo: 'pedido', categoria: 'Remédio', descricao: 'x', urgencia: 'urgentissima' })).status, 400);
});

test('JSON malformado -> 400', async () => {
  const r = await fetch(`${api.url}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
  assert.equal(r.status, 400);
});

test('morador não altera status nem vagas (403); voluntário pode', async () => {
  const morador = await entrar('morador');
  assert.equal((await morador.patch('/ocorrencias/1', { acao: 'atender' })).status, 403);
  assert.equal((await morador.patch('/abrigos/1/vagas', { quantidade: 1 })).status, 403);
  assert.equal((await morador.post('/ajuda/encerrar-antigos', {})).status, 403);

  const vol = await entrar('voluntario');
  const r = await vol.patch('/ocorrencias/1', { acao: 'atender' });
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'em_atendimento');
  assert.equal((await vol.patch('/abrigos/1/vagas', { quantidade: 2 })).body.vagasOcupadas, 70);
  assert.deepEqual((await vol.post('/ajuda/encerrar-antigos', { dias: 7 })).body, { encerrados: 3 });
});

test('erro de regra da procedure (ORA-20xxx) vira 422 com a mensagem', async () => {
  const vol = await entrar('voluntario');
  const r = await vol.patch('/abrigos/2/vagas', { quantidade: 1 });
  assert.equal(r.status, 422);
  assert.equal(r.body.erro, 'Abrigo sem vagas suficientes');
});

test('distância do pedido usa a última posição de check-in quando o app não envia lat/lng', async () => {
  const http = await entrar();
  await http.post('/checkins', { status: 'estou_bem', latitude: -23.5489, longitude: -46.6388 });
  const lista = await http.get('/ajuda');
  assert.equal(lista.body.find((p) => p.id === 1).distancia, '0 m');
});
