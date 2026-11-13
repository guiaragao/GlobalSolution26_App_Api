// Acesso ao Oracle: todo o SQL da API fica aqui.
// Recebe "execute(sql, binds)" (de db.js) para poder ser testado sem banco.
// Os apelidos entre aspas ("vagasOcupadas") já devolvem os campos no formato do app.

const oracledb = require('oracledb');

const OUT_NUMERO = () => ({ dir: oracledb.BIND_OUT, type: oracledb.NUMBER });

const COLS_USUARIO = `id "id", nome "nome", email "email", bairro "bairro", perfil "perfil"`;
const COLS_OCORRENCIA = `id "id", tipo "tipo", descricao "descricao", latitude "latitude", longitude "longitude",
  status "status", prioridade "prioridade", relatos "relatos", bairro "bairro", foto_uri "fotoUri", criada_em "criadaEm"`;
const COLS_ABRIGO = `id "id", nome "nome", endereco "endereco", latitude "latitude", longitude "longitude",
  capacidade "capacidade", vagas_ocupadas "vagasOcupadas"`;
const COLS_PEDIDO = `id "id", modo "modo", categoria "categoria", descricao "descricao", urgencia "urgencia",
  status "status", latitude "latitude", longitude "longitude"`;

module.exports = function criarRepositorio(execute) {
  const linhas = async (sql, binds = {}) => (await execute(sql, binds)).rows;
  const linha = async (sql, binds) => (await linhas(sql, binds))[0];

  const buscarOcorrencia = (id) => linha(`SELECT ${COLS_OCORRENCIA} FROM ocorrencia WHERE id = :id`, { id });
  const buscarAbrigo = (id) => linha(`SELECT ${COLS_ABRIGO} FROM abrigo WHERE id = :id`, { id });
  // UPDATE simples; devolve a linha atualizada ou undefined se o id não existe.
  const atualizarOcorrencia = async (sql, binds) =>
    (await execute(sql, binds)).rowsAffected ? buscarOcorrencia(binds.id) : undefined;

  return {
    // ---------- usuários ----------
    buscarUsuarioPorEmail: (email) =>
      linha(`SELECT ${COLS_USUARIO}, senha_hash "senhaHash" FROM usuario WHERE email = :email`, { email }),

    async criarUsuario({ nome, email, bairro, perfil, senhaHash }) {
      const r = await execute(
        `INSERT INTO usuario (nome, email, senha_hash, bairro, perfil)
         VALUES (:nome, :email, :senhaHash, :bairro, :perfil) RETURNING id INTO :id`,
        { nome, email, senhaHash, bairro, perfil, id: OUT_NUMERO() },
      );
      return { id: r.outBinds.id[0], nome, email, bairro, perfil };
    },

    // ---------- ocorrências ----------
    // shortcut: sem paginação (últimas 200), suficiente para um bairro; paginar se crescer.
    listarOcorrencias: () =>
      linhas(`SELECT ${COLS_OCORRENCIA} FROM ocorrencia ORDER BY criada_em DESC FETCH FIRST 200 ROWS ONLY`),

    // Pessoa 4: PRC_REGISTRAR_OCORRENCIA define bairro, prioridade inicial e status.
    async registrarOcorrencia(idUsuario, { tipo, descricao, latitude, longitude, fotoUri }) {
      const r = await execute(
        `BEGIN prc_registrar_ocorrencia(:idUsuario, :tipo, :descricao, :latitude, :longitude, :fotoUri, :id); END;`,
        { idUsuario, tipo, descricao, latitude, longitude, fotoUri, id: OUT_NUMERO() },
      );
      return buscarOcorrencia(r.outBinds.id);
    },

    // Pessoa 4: o trigger de OCORRENCIA escala a prioridade com 3+ relatos na mesma área.
    confirmarOcorrencia: (id) =>
      atualizarOcorrencia(`UPDATE ocorrencia SET relatos = relatos + 1 WHERE id = :id`, { id }),

    alterarStatusOcorrencia: (id, status) =>
      atualizarOcorrencia(`UPDATE ocorrencia SET status = :status WHERE id = :id`, { id, status }),

    // ---------- abrigos ----------
    listarAbrigos: () => linhas(`SELECT ${COLS_ABRIGO} FROM abrigo ORDER BY nome`),

    // Pessoa 4: FN_ABRIGO_MAIS_PROXIMO devolve o id do abrigo com vaga mais perto (ou NULL).
    async abrigoMaisProximo(lat, lng) {
      const a = await linha(
        `SELECT ${COLS_ABRIGO} FROM abrigo WHERE id = (SELECT fn_abrigo_mais_proximo(:lat, :lng) FROM dual)`,
        { lat, lng },
      );
      return a ?? null;
    },

    // Pessoa 4: PRC_CONTROLE_VAGAS soma (entrada) ou subtrai (saída) vagas ocupadas.
    async controlarVagas(id, quantidade) {
      await execute(`BEGIN prc_controle_vagas(:id, :quantidade); END;`, { id, quantidade });
      return buscarAbrigo(id);
    },

    // ---------- ajuda ----------
    listarPedidos: () =>
      linhas(`SELECT ${COLS_PEDIDO} FROM pedido_ajuda
              ORDER BY CASE status WHEN 'aguardando' THEN 0 ELSE 1 END, criado_em DESC
              FETCH FIRST 200 ROWS ONLY`),

    async criarPedido(idUsuario, { modo, categoria, descricao, urgencia, latitude, longitude }) {
      const r = await execute(
        `INSERT INTO pedido_ajuda (id_usuario, modo, categoria, descricao, urgencia, latitude, longitude)
         VALUES (:idUsuario, :modo, :categoria, :descricao, :urgencia, :latitude, :longitude) RETURNING id INTO :id`,
        { idUsuario, modo, categoria, descricao, urgencia, latitude, longitude, id: OUT_NUMERO() },
      );
      return { id: r.outBinds.id[0], modo, categoria, descricao, urgencia, status: 'aguardando', latitude, longitude };
    },

    // Pessoa 4: PRC_ENCERRAR_PEDIDOS_ANTIGOS marca como atendidos os pedidos com mais de p_dias.
    async encerrarPedidosAntigos(dias) {
      const r = await execute(`BEGIN prc_encerrar_pedidos_antigos(:dias, :qtd); END;`, { dias, qtd: OUT_NUMERO() });
      return r.outBinds.qtd;
    },

    // ---------- check-in ----------
    async registrarCheckin(idUsuario, { status, latitude, longitude }) {
      const r = await execute(
        `INSERT INTO checkin (id_usuario, status, latitude, longitude)
         VALUES (:idUsuario, :status, :latitude, :longitude) RETURNING id INTO :id`,
        { idUsuario, status, latitude, longitude, id: OUT_NUMERO() },
      );
      return r.outBinds.id[0];
    },

    ultimaPosicao: (idUsuario) =>
      linha(`SELECT latitude "latitude", longitude "longitude" FROM checkin
             WHERE id_usuario = :idUsuario AND latitude IS NOT NULL
             ORDER BY criado_em DESC FETCH FIRST 1 ROW ONLY`, { idUsuario }),

    // ---------- indicadores ----------
    async indicadores() {
      const i = await linha(`SELECT
        (SELECT COUNT(*) FROM ocorrencia WHERE status = 'aberta') "ocorrenciasAbertas",
        (SELECT COUNT(*) FROM ocorrencia WHERE status = 'em_atendimento') "ocorrenciasEmAtendimento",
        (SELECT COUNT(*) FROM ocorrencia WHERE status = 'resolvida') "ocorrenciasResolvidas",
        (SELECT COUNT(*) FROM ocorrencia WHERE prioridade = 'critica' AND status <> 'resolvida') "ocorrenciasCriticas",
        (SELECT NVL(SUM(capacidade), 0) FROM abrigo) "capacidadeAbrigos",
        (SELECT NVL(SUM(vagas_ocupadas), 0) FROM abrigo) "vagasOcupadas",
        (SELECT COUNT(*) FROM pedido_ajuda WHERE status = 'aguardando') "pedidosAguardando",
        (SELECT COUNT(*) FROM pedido_ajuda WHERE status = 'atendido') "pedidosAtendidos",
        (SELECT COUNT(*) FROM checkin WHERE status = 'estou_bem' AND criado_em > SYSTIMESTAMP - INTERVAL '1' DAY) "checkinsEstouBem24h",
        (SELECT COUNT(*) FROM checkin WHERE status = 'preciso_de_ajuda' AND criado_em > SYSTIMESTAMP - INTERVAL '1' DAY) "checkinsPrecisoAjuda24h"
        FROM dual`);
      const pct = i.capacidadeAbrigos ? (i.vagasOcupadas / i.capacidadeAbrigos) * 100 : 0;
      return { ...i, ocupacaoAbrigosPct: Math.round(pct * 10) / 10 };
    },
  };
};
