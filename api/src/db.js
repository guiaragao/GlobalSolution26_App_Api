// Conexão com o Oracle (node-oracledb). Usa um pool de conexões.
// Modo "thin" por padrão (não precisa instalar o Oracle Instant Client).

const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // linhas como objetos { coluna: valor }
oracledb.autoCommit = true; // cada comando da API é uma transação curta

async function iniciar() {
  // Banco antigo que exige o modo "thick": defina ORACLE_CLIENT_LIB com a pasta do Instant Client.
  if (process.env.ORACLE_CLIENT_LIB) oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB });
  await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
  });
}

// Pega uma conexão do pool, executa e devolve a conexão (mesmo se der erro).
async function execute(sql, binds = {}, opcoes = {}) {
  const conexao = await oracledb.getConnection();
  try {
    return await conexao.execute(sql, binds, opcoes);
  } finally {
    await conexao.close();
  }
}

async function encerrar() {
  await oracledb.getPool().close(10);
}

module.exports = { iniciar, execute, encerrar };
