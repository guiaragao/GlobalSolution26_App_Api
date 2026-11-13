// Rotas HTTP da API AlertaBairro (Express 5).
// criarApp({ repo, segredo }) não abre conexão: recebe o repositório pronto (Oracle ou em memória).

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PERFIS = ['morador', 'idoso', 'voluntario'];
const STATUS_CHECKIN = ['estou_bem', 'preciso_de_ajuda'];
const MODOS = ['pedido', 'oferta'];
const URGENCIAS = ['baixa', 'media', 'alta'];
const CUSTO_BCRYPT = 10;
// Hash usado quando o e-mail não existe, para o login levar o mesmo tempo (não revela quem tem conta).
const HASH_FALSO = bcrypt.hashSync('senha-inexistente', CUSTO_BCRYPT);

class ErroHttp extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}
const falha = (status, mensagem) => { throw new ErroHttp(status, mensagem); };
const exigir = (condicao, mensagem) => condicao || falha(400, mensagem);

// ---------- validação dos dados recebidos ----------
const texto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const numeroEntre = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const coordenadaValida = (lat, lng) => numeroEntre(lat, -90, 90) && numeroEntre(lng, -180, 180);
const semCoordenada = (lat, lng) => lat == null && lng == null;
const daQuery = (v) => (v === undefined || v === '' ? NaN : Number(v));
const idDaRota = (v) => { const id = Number(v); exigir(Number.isInteger(id) && id > 0, 'id inválido'); return id; };

// ---------- distância (Haversine), igual ao utils/geo.ts do app ----------
function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
function formatarDistancia(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}
// Pedido sai sem latitude/longitude (privacidade de quem pediu ajuda): só a distância em texto.
function pedidoParaApp({ latitude, longitude, ...pedido }, pos) {
  const temCoord = latitude != null && pos;
  return { ...pedido, distancia: temCoord ? formatarDistancia(distanciaKm(pos, { latitude, longitude })) : 'distância desconhecida' };
}

module.exports = function criarApp({ repo, segredo, expiraEm = '8h' }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // CORS para o Expo Web; o app nativo não precisa. Token vai no cabeçalho, não em cookie.
  app.use((req, res, next) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const sessao = (usuario) => ({
    token: jwt.sign({ sub: String(usuario.id), perfil: usuario.perfil }, segredo, { expiresIn: expiraEm }),
    usuario,
  });

  // ================= rotas públicas =================
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/auth/cadastro', async (req, res) => {
    const { nome, email, bairro, senha, perfil } = req.body ?? {};
    const emailNorm = typeof email === 'string' ? email.trim().toLowerCase() : '';
    exigir(texto(nome, 100), 'nome é obrigatório (até 100 caracteres)');
    exigir(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm) && emailNorm.length <= 150, 'e-mail inválido');
    exigir(texto(bairro, 100), 'bairro é obrigatório (até 100 caracteres)');
    // bcrypt só usa os primeiros 72 bytes da senha.
    exigir(typeof senha === 'string' && senha.length >= 6 && Buffer.byteLength(senha) <= 72, 'senha deve ter de 6 a 72 caracteres');
    exigir(PERFIS.includes(perfil), `perfil deve ser: ${PERFIS.join(', ')}`);

    if (await repo.buscarUsuarioPorEmail(emailNorm)) falha(409, 'e-mail já cadastrado');
    const senhaHash = await bcrypt.hash(senha, CUSTO_BCRYPT);
    const usuario = await repo.criarUsuario({ nome: nome.trim(), email: emailNorm, bairro: bairro.trim(), perfil, senhaHash });
    res.status(201).json(sessao(usuario));
  });

  app.post('/auth/login', async (req, res) => {
    const { email, senha } = req.body ?? {};
    exigir(typeof email === 'string' && typeof senha === 'string', 'informe e-mail e senha');
    const encontrado = await repo.buscarUsuarioPorEmail(email.trim().toLowerCase());
    const senhaOk = await bcrypt.compare(senha, encontrado?.senhaHash ?? HASH_FALSO);
    if (!encontrado || !senhaOk) falha(401, 'e-mail ou senha inválidos');
    const { senhaHash, ...usuario } = encontrado;
    res.json(sessao(usuario));
  });

  // ================= daqui para baixo exige token JWT =================
  app.use((req, res, next) => {
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    try {
      if (tipo !== 'Bearer') throw new Error();
      const p = jwt.verify(token, segredo, { algorithms: ['HS256'] });
      req.usuario = { id: Number(p.sub), perfil: p.perfil };
    } catch {
      return next(new ErroHttp(401, 'token ausente, inválido ou expirado'));
    }
    next();
  });
  const soVoluntario = (req) => req.usuario.perfil === 'voluntario' || falha(403, 'ação permitida só para voluntários');
  const encontrouOu404 = (v, oque) => v ?? falha(404, `${oque} não encontrado(a)`);

  // ---------- ocorrências ----------
  app.get('/ocorrencias', async (req, res) => res.json(await repo.listarOcorrencias()));

  app.post('/ocorrencias', async (req, res) => {
    const { tipo, descricao, latitude, longitude, fotoUri } = req.body ?? {};
    exigir(texto(tipo, 50), 'tipo é obrigatório (até 50 caracteres)');
    exigir(texto(descricao, 500), 'descrição é obrigatória (até 500 caracteres)');
    exigir(coordenadaValida(latitude, longitude), 'latitude/longitude inválidas');
    exigir(fotoUri == null || (typeof fotoUri === 'string' && fotoUri.length <= 500), 'fotoUri inválida');
    const nova = { tipo: tipo.trim(), descricao: descricao.trim(), latitude, longitude, fotoUri: fotoUri ?? null };
    res.status(201).json(await repo.registrarOcorrencia(req.usuario.id, nova));
  });

  const ACOES = {
    confirmar: (id) => repo.confirmarOcorrencia(id),
    atender: (id, req) => soVoluntario(req) && repo.alterarStatusOcorrencia(id, 'em_atendimento'),
    resolver: (id, req) => soVoluntario(req) && repo.alterarStatusOcorrencia(id, 'resolvida'),
  };
  app.patch('/ocorrencias/:id', async (req, res) => {
    const id = idDaRota(req.params.id);
    const acao = req.body?.acao;
    exigir(Object.hasOwn(ACOES, acao), `acao deve ser: ${Object.keys(ACOES).join(', ')}`);
    res.json(encontrouOu404(await ACOES[acao](id, req), 'ocorrência'));
  });

  // ---------- abrigos ----------
  app.get('/abrigos', async (req, res) => res.json(await repo.listarAbrigos()));

  app.get('/abrigos/proximo', async (req, res) => {
    const lat = daQuery(req.query.lat);
    const lng = daQuery(req.query.lng);
    exigir(coordenadaValida(lat, lng), 'informe lat e lng válidos');
    res.json(await repo.abrigoMaisProximo(lat, lng));
  });

  app.patch('/abrigos/:id/vagas', async (req, res) => {
    soVoluntario(req);
    const id = idDaRota(req.params.id);
    const quantidade = req.body?.quantidade;
    exigir(Number.isInteger(quantidade) && quantidade !== 0 && Math.abs(quantidade) <= 1000, 'quantidade deve ser inteiro diferente de 0 (+ entrada, - saída)');
    res.json(encontrouOu404(await repo.controlarVagas(id, quantidade), 'abrigo'));
  });

  // ---------- ajuda ----------
  // Posição para calcular distância: a enviada pelo app ou a do último check-in do usuário.
  const posicao = async (lat, lng, idUsuario) =>
    coordenadaValida(lat, lng) ? { latitude: lat, longitude: lng } : repo.ultimaPosicao(idUsuario);

  app.get('/ajuda', async (req, res) => {
    const pos = await posicao(daQuery(req.query.lat), daQuery(req.query.lng), req.usuario.id);
    res.json((await repo.listarPedidos()).map((p) => pedidoParaApp(p, pos)));
  });

  app.post('/ajuda', async (req, res) => {
    const { modo, categoria, descricao, urgencia, latitude, longitude } = req.body ?? {};
    exigir(MODOS.includes(modo), `modo deve ser: ${MODOS.join(', ')}`);
    exigir(texto(categoria, 50), 'categoria é obrigatória (até 50 caracteres)');
    exigir(texto(descricao, 500), 'descrição é obrigatória (até 500 caracteres)');
    exigir(URGENCIAS.includes(urgencia), `urgência deve ser: ${URGENCIAS.join(', ')}`);
    exigir(semCoordenada(latitude, longitude) || coordenadaValida(latitude, longitude), 'latitude/longitude inválidas');
    const pos = await posicao(latitude, longitude, req.usuario.id);
    const novo = { modo, categoria: categoria.trim(), descricao: descricao.trim(), urgencia, latitude: pos?.latitude ?? null, longitude: pos?.longitude ?? null };
    res.status(201).json(pedidoParaApp(await repo.criarPedido(req.usuario.id, novo), pos));
  });

  app.post('/ajuda/encerrar-antigos', async (req, res) => {
    soVoluntario(req);
    const dias = req.body?.dias ?? 7;
    exigir(Number.isInteger(dias) && dias >= 1 && dias <= 365, 'dias deve ser inteiro de 1 a 365');
    res.json({ encerrados: await repo.encerrarPedidosAntigos(dias) });
  });

  // ---------- check-in ----------
  app.post('/checkins', async (req, res) => {
    const { status, latitude, longitude } = req.body ?? {};
    exigir(STATUS_CHECKIN.includes(status), `status deve ser: ${STATUS_CHECKIN.join(', ')}`);
    exigir(semCoordenada(latitude, longitude) || coordenadaValida(latitude, longitude), 'latitude/longitude inválidas');
    const id = await repo.registrarCheckin(req.usuario.id, { status, latitude: latitude ?? null, longitude: longitude ?? null });
    res.status(201).json({ id, status });
  });

  // ---------- indicadores ----------
  app.get('/indicadores', async (req, res) => res.json(await repo.indicadores()));

  // ---------- 404 e tratamento de erros ----------
  app.use((req, res) => res.status(404).json({ erro: 'rota não encontrada' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.status && err.status < 500) return res.status(err.status).json({ erro: err instanceof ErroHttp ? err.message : 'requisição inválida' });
    // RAISE_APPLICATION_ERROR(-20000..-20999) das rotinas PL/SQL = regra de negócio violada.
    if (err.errorNum >= 20000 && err.errorNum <= 20999) {
      return res.status(422).json({ erro: err.message.split('\n')[0].replace(/^ORA-\d+:\s*/, '') });
    }
    if (err.errorNum === 1) return res.status(409).json({ erro: 'registro duplicado' });
    console.error(err);
    res.status(500).json({ erro: 'erro interno no servidor' });
  });

  return app;
};
