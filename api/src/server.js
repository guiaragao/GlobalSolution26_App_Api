// Ponto de entrada: lê o .env, conecta no Oracle e sobe a API.

try { process.loadEnvFile(); } catch { /* sem .env: usa as variáveis do sistema */ }

const db = require('./db');
const criarApp = require('./app');
const criarRepositorio = require('./repositorio');

const faltando = ['JWT_SECRET', 'ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECT_STRING'].filter((v) => !process.env[v]);
if (faltando.length) {
  console.error(`Configure no .env: ${faltando.join(', ')} (veja .env.example)`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET precisa ter pelo menos 32 caracteres.');
  process.exit(1);
}

(async () => {
  await db.iniciar();
  const app = criarApp({
    repo: criarRepositorio(db.execute),
    segredo: process.env.JWT_SECRET,
    expiraEm: process.env.JWT_EXPIRES_IN || '8h',
  });
  const porta = Number(process.env.PORT || 3000);
  // 0.0.0.0: aceita conexões do celular na mesma rede Wi-Fi.
  const servidor = app.listen(porta, '0.0.0.0', () => console.log(`API AlertaBairro rodando na porta ${porta}`));

  process.on('SIGINT', () => servidor.close(async () => { await db.encerrar(); process.exit(0); }));
})().catch((e) => {
  console.error('Falha ao iniciar a API:', e.message);
  process.exit(1);
});
