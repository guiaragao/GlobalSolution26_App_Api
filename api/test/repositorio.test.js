// Contrato com o banco: confere que a API chama as procedures/functions da Pessoa 4
// com os parâmetros certos. Usa um "execute" que só grava as chamadas.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracledb = require('oracledb');
const criarRepositorio = require('../src/repositorio');

function gravador(resposta = () => ({ rows: [{ id: 7 }], outBinds: { id: 7, qtd: 4 }, rowsAffected: 1 })) {
  const chamadas = [];
  const execute = async (sql, binds) => { chamadas.push({ sql: sql.replace(/\s+/g, ' '), binds }); return resposta(sql); };
  return { chamadas, repo: criarRepositorio(execute) };
}

test('registrarOcorrencia chama PRC_REGISTRAR_OCORRENCIA com OUT do id', async () => {
  const { chamadas, repo } = gravador();
  await repo.registrarOcorrencia(5, { tipo: 'Alagamento', descricao: 'd', latitude: -23.5, longitude: -46.6, fotoUri: null });
  assert.match(chamadas[0].sql, /BEGIN prc_registrar_ocorrencia\(:idUsuario, :tipo, :descricao, :latitude, :longitude, :fotoUri, :id\); END;/i);
  assert.equal(chamadas[0].binds.idUsuario, 5);
  assert.equal(chamadas[0].binds.id.dir, oracledb.BIND_OUT);
  assert.match(chamadas[1].sql, /FROM ocorrencia WHERE id = :id/i);
  assert.equal(chamadas[1].binds.id, 7);
});

test('confirmarOcorrencia soma relato (dispara o trigger de escalonamento) e relê a linha', async () => {
  const { chamadas, repo } = gravador();
  await repo.confirmarOcorrencia(3);
  assert.match(chamadas[0].sql, /UPDATE ocorrencia SET relatos = relatos \+ 1 WHERE id = :id/i);
  assert.match(chamadas[1].sql, /SELECT .* FROM ocorrencia/i);
});

test('confirmarOcorrencia devolve undefined quando o id não existe', async () => {
  const { repo } = gravador(() => ({ rows: [], rowsAffected: 0 }));
  assert.equal(await repo.confirmarOcorrencia(999), undefined);
});

test('abrigoMaisProximo usa FN_ABRIGO_MAIS_PROXIMO e devolve null sem vaga', async () => {
  const { chamadas, repo } = gravador(() => ({ rows: [] }));
  assert.equal(await repo.abrigoMaisProximo(-23.5, -46.6), null);
  assert.match(chamadas[0].sql, /fn_abrigo_mais_proximo\(:lat, :lng\)/i);
  assert.deepEqual(chamadas[0].binds, { lat: -23.5, lng: -46.6 });
});

test('controlarVagas chama PRC_CONTROLE_VAGAS', async () => {
  const { chamadas, repo } = gravador();
  await repo.controlarVagas(2, -1);
  assert.match(chamadas[0].sql, /BEGIN prc_controle_vagas\(:id, :quantidade\); END;/i);
  assert.deepEqual(chamadas[0].binds, { id: 2, quantidade: -1 });
});

test('encerrarPedidosAntigos chama PRC_ENCERRAR_PEDIDOS_ANTIGOS e devolve a quantidade', async () => {
  const { chamadas, repo } = gravador();
  assert.equal(await repo.encerrarPedidosAntigos(7), 4);
  assert.match(chamadas[0].sql, /BEGIN prc_encerrar_pedidos_antigos\(:dias, :qtd\); END;/i);
});

test('indicadores calcula a ocupação dos abrigos em %', async () => {
  const { repo } = gravador(() => ({ rows: [{ capacidadeAbrigos: 200, vagasOcupadas: 50 }] }));
  assert.equal((await repo.indicadores()).ocupacaoAbrigosPct, 25);
});
