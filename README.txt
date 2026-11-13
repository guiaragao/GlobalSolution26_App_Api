ALERTABAIRRO - GLOBAL SOLUTION 2026
===================================

README final do projeto, juntando as secoes de todos os integrantes.
Links (GitHub e videos): arquivo links.txt

EQUIPE
------
[NOME - RM - funcao]

ESTRUTURA DO REPOSITORIO
------------------------
app/     App React Native + Expo + TypeScript (projeto em app/alertabairro)
api/     API REST Node.js + Express + Oracle (login JWT, ocorrencias, abrigos, ajuda,
         check-in, indicadores)
banco/   Scripts Oracle: tabelas, procedures, functions, trigger e testes
links.txt  links do GitHub e dos videos

COMO RODAR TUDO (ordem)
-----------------------
1. banco/: rode os scripts no Oracle (tabelas, depois rotinas)   -> secao 3
2. api/:   npm install, preencha o .env, npm start               -> secao 2
3. app/:   EXPO_PUBLIC_API_URL=http://IP_DO_PC:3000 npx expo start -> secao 1


############################################################
# 1. APP
############################################################

ALERTABAIRRO - APP (React Native + Expo + TypeScript)
=====================================================

COMO APLICAR O CODIGO (passo a passo)
-------------------------------------
1. Crie o projeto Expo com TypeScript (na pasta app/ do repositorio):

   npx create-expo-app@latest app --template blank-typescript
   cd app

2. Instale as dependencias (use "expo install" para pegar versoes compativeis):

   npx expo install react-native-screens react-native-safe-area-context react-native-maps expo-location expo-image-picker expo-image-manipulator @expo/vector-icons
   npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs axios

3. Copie para dentro de app/ os arquivos deste pacote:
   - App.tsx (substitui o do template)
   - pasta src/ inteira

4. Permissoes (abra app.json e adicione dentro de "expo"):

   "plugins": [
     ["expo-location", { "locationWhenInUsePermission": "O AlertaBairro usa sua localizacao para registrar ocorrencias e achar abrigos." }],
     ["expo-image-picker", { "cameraPermission": "O AlertaBairro usa a camera para anexar fotos as ocorrencias." }]
   ]

5. Rode o app:

   npx expo start

   Abra no celular com o app Expo Go (QR code) ou no emulador (tecla a / i).

MODO DE DADOS (falsos x API real)
---------------------------------
Arquivo: src/servicos/api.ts
- Sem a variavel EXPO_PUBLIC_API_URL -> USE_MOCK = true, usa dados falsos
  (src/servicos/mock.ts). Funciona sem API.
- Com EXPO_PUBLIC_API_URL=http://IP_DO_PC:3000 -> USE_MOCK = false, chama a API Node.js
  (pasta api/). Ex.: EXPO_PUBLIC_API_URL=http://192.168.0.10:3000 npx expo start
  Celular e computador devem estar na mesma rede Wi-Fi.

Rotas esperadas da API (contrato combinado no dia 1):
  POST  /auth/login           -> { token, usuario }
  POST  /auth/cadastro        -> { token, usuario }
  GET   /ocorrencias
  POST  /ocorrencias
  PATCH /ocorrencias/:id      -> body { acao: "confirmar" }
  GET   /abrigos
  GET   /abrigos/proximo?lat=&lng=
  GET   /ajuda
  POST  /ajuda
  POST  /checkins             -> body { status, latitude, longitude }
Se a API devolver nomes de campos diferentes, ajuste so em src/servicos/api.ts.

ESTRUTURA
---------
App.tsx                   ponto de entrada
src/tema/                 cores, espacamentos e fontes
src/modelos/              tipos (Usuario, Ocorrencia, Abrigo, PedidoAjuda...)
src/utils/geo.ts          distancia (Haversine), formatacao, tempo decorrido
src/servicos/             api.ts (camada de acesso), mock.ts (dados falsos), localizacao.ts (GPS)
src/contexto/             AuthContext (usuario logado, entrar, cadastrar, sair)
src/componentes/          Botao, Chip, Campo, Cartao, Etiqueta, BotaoSOS
src/navegacao/            pilha de entrada + pilha do app + abas inferiores
src/telas/                10 telas (abaixo)

TELAS
-----
Inicio, Login, Cadastro         entrada (nao contam como funcionalidade)
Mapa, Detalhe, NovaOcorrencia   funcionalidade 1: mapa e ocorrencias
Abrigos                         funcionalidade 2: abrigos, rota e SOS
Ajuda, NovoPedido               funcionalidade 3: rede de ajuda e "estou bem"
Perfil                          dados do usuario, preferencias e sair

GERENCIAMENTO DE MEMORIA E EFICIENCIA (para a documentacao)
-----------------------------------------------------------
- FlatList (virtualizada) com initialNumToRender, windowSize e removeClippedSubviews:
  renderiza so o que aparece na tela (Mapa.tsx).
- React.memo nos itens de lista e nos componentes de interface: evita re-renderizar
  o que nao mudou (ItemOcorrencia, ItemAbrigo, ItemPedido, Botao, Chip, Cartao, Etiqueta).
- useMemo para filtros (lista filtrada) e para o valor do contexto de autenticacao.
- useCallback em funcoes passadas como props, para manter referencias estaveis.
- Limpeza em useEffect/useFocusEffect: flag "ativo" evita atualizar estado depois
  que a tela foi fechada (sem vazamento de memoria nem aviso de estado desmontado).
- Fotos reduzidas (largura 1024, JPEG 60%) antes de guardar/enviar, com
  expo-image-manipulator (NovaOcorrencia.tsx): menos memoria e menos dados.
- Recarga de dados somente quando a tela ganha foco; Promise.all para chamadas em paralelo.
- Camada unica de API (api.ts): trocar de dados falsos para API real sem mexer nas telas.

JUSTIFICATIVA DAS TECNOLOGIAS
-----------------------------
- React Native + Expo: um codigo para Android e iOS, rodar com Expo Go sem configurar
  ambiente nativo, ideal para o prazo curto e para a demonstracao em video.
- TypeScript: tipos evitam erros de integracao com a API.
- React Navigation: padrao de navegacao (pilha + abas).
- react-native-maps: mapa nativo com marcadores e rota.
- expo-location / expo-image-picker / expo-image-manipulator: GPS, camera e compressao.
- axios: chamadas HTTP simples, com timeout e cabecalho de autenticacao (JWT).

LIMITES CONHECIDOS (deste prototipo)
------------------------------------
- Os botoes "Fonte grande" e "Alto contraste" do Perfil ainda nao alteram o app
  (apenas guardam o estado local).
- A rota no mapa e uma linha reta entre voce e o abrigo (nao segue as ruas).
- O token de login fica so em memoria (ao fechar o app, e preciso entrar de novo).
- O mapa usa o provedor padrao do react-native-maps; para publicar o app, o Android
  exige chave do Google Maps.


############################################################
# 2. API
############################################################

ALERTABAIRRO - API (Node.js + Express + Oracle)
===============================================

API REST que atende o app (pasta app/) e conversa com o banco Oracle (pasta banco/).
Login com senha criptografada (bcrypt) e token JWT. Ocorrencias, abrigos, vagas e
pedidos antigos passam pelas procedures, functions e trigger da Pessoa 4.


COMO RODAR A API (passo a passo)
--------------------------------
Pre-requisitos: Node.js 20.12 ou mais novo, acesso ao Oracle (ex.: oracle.fiap.com.br)
e as tabelas/rotinas da pasta banco/ ja criadas no seu usuario.

1. Entre na pasta da API e instale as dependencias:

   cd api
   npm install

2. Crie o arquivo de configuracao a partir do exemplo e preencha:

   copy .env.example .env        (Windows)
   cp .env.example .env          (Linux/Mac)

   - ORACLE_USER / ORACLE_PASSWORD: seu usuario e senha do Oracle (ex.: rm123456)
   - ORACLE_CONNECT_STRING: oracle.fiap.com.br:1521/ORCL
   - JWT_SECRET: texto longo e secreto (minimo 32 caracteres). Para gerar:
       node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

3. Suba a API:

   npm start            (ou "npm run dev" para reiniciar sozinho ao salvar)

   Saida esperada: "API AlertaBairro rodando na porta 3000"
   Teste rapido no navegador: http://localhost:3000/health  ->  {"status":"ok"}

4. Ligue o app na API: descubra o IP do computador (ipconfig no Windows) e rode o app com

   (PowerShell)  $env:EXPO_PUBLIC_API_URL="http://SEU_IP:3000"; npx expo start
   (bash)        EXPO_PUBLIC_API_URL=http://SEU_IP:3000 npx expo start

   Sem essa variavel o app continua usando os dados falsos (mock).
   Celular e computador precisam estar na mesma rede Wi-Fi. Libere a porta 3000 no firewall.


TESTES (inclui o teste de integracao)
-------------------------------------
   npm test

Roda 3 arquivos com o test runner nativo do Node (node:test), sem precisar do Oracle:
- test/integracao.test.js : percorre as rotas na ordem em que o app usa
  (cadastro -> login -> ocorrencias -> confirmar -> abrigos -> abrigo mais proximo
   -> check-in -> pedido de ajuda -> lista de ajuda -> indicadores).
- test/api.test.js        : bcrypt, JWT (expiracao, token adulterado), validacoes,
  permissoes (morador x voluntario), JSON malformado e erros ORA-20xxx -> 422.
- test/repositorio.test.js: contrato com o banco: confere o nome e os parametros
  das procedures/functions chamadas.

Teste de integracao contra a API REAL (Oracle + rotinas da Pessoa 4):
   1) suba a API (npm start) em um terminal
   2) em outro terminal:
      (PowerShell)  $env:API_URL="http://localhost:3000"; npm run test:integracao
      (bash)        API_URL=http://localhost:3000 npm run test:integracao
   Ele cria um usuario de teste (teste.<numero>@alertabairro.com), uma ocorrencia,
   um check-in e um pedido de ajuda no banco.


ENDPOINTS
---------
Todas as respostas sao JSON. Erros vem como { "erro": "mensagem" }.
Rotas marcadas com [JWT] exigem o cabecalho:  Authorization: Bearer <token>

Metodo Rota                        Auth      Corpo / parametros                         Resposta
------ --------------------------- --------- ------------------------------------------ ---------------------------
GET    /health                     publica   -                                          200 {status:"ok"}
POST   /auth/cadastro              publica   {nome,email,bairro,senha,perfil}           201 {token, usuario}
POST   /auth/login                 publica   {email,senha}                              200 {token, usuario}
GET    /ocorrencias                [JWT]     -                                          200 Ocorrencia[] (ultimas 200)
POST   /ocorrencias                [JWT]     {tipo,descricao,latitude,longitude,fotoUri?} 201 Ocorrencia
PATCH  /ocorrencias/:id            [JWT]     {acao:"confirmar"|"atender"|"resolver"}    200 Ocorrencia
GET    /abrigos                    [JWT]     -                                          200 Abrigo[]
GET    /abrigos/proximo            [JWT]     ?lat=-23.55&lng=-46.63                     200 Abrigo ou null
PATCH  /abrigos/:id/vagas          [JWT]*    {quantidade: +n entrada / -n saida}        200 Abrigo
GET    /ajuda                      [JWT]     ?lat=&lng= (opcionais)                     200 PedidoAjuda[]
POST   /ajuda                      [JWT]     {modo,categoria,descricao,urgencia,latitude?,longitude?} 201 PedidoAjuda
POST   /ajuda/encerrar-antigos     [JWT]*    {dias?: 1..365, padrao 7}                  200 {encerrados: n}
POST   /checkins                   [JWT]     {status,latitude?,longitude?}              201 {id,status}
GET    /indicadores                [JWT]     -                                          200 Indicadores
(*) so perfil "voluntario". "atender" e "resolver" em /ocorrencias/:id tambem.

Valores aceitos:
- perfil:   morador | idoso | voluntario
- status do check-in: estou_bem | preciso_de_ajuda
- modo:     pedido | oferta          urgencia: baixa | media | alta
- senha: 6 a 72 caracteres; e-mail e normalizado (sem espacos, minusculo)

Formato dos objetos (igual a src/modelos/index.ts do app):
- usuario:     {id,nome,email,bairro,perfil}               (nunca devolve a senha)
- Ocorrencia:  {id,tipo,descricao,latitude,longitude,status,prioridade,relatos,bairro,fotoUri,criadaEm}
- Abrigo:      {id,nome,endereco,latitude,longitude,capacidade,vagasOcupadas}
- PedidoAjuda: {id,modo,categoria,descricao,urgencia,status,distancia}
  A API NAO devolve a latitude/longitude de quem pediu ajuda (privacidade). Devolve so
  "distancia" em texto ("300 m", "1,2 km"), calculada a partir de lat/lng enviados ou,
  se o app nao enviar, do ultimo check-in do usuario.
- Indicadores: {ocorrenciasAbertas, ocorrenciasEmAtendimento, ocorrenciasResolvidas,
  ocorrenciasCriticas, capacidadeAbrigos, vagasOcupadas, ocupacaoAbrigosPct,
  pedidosAguardando, pedidosAtendidos, checkinsEstouBem24h, checkinsPrecisoAjuda24h}

Codigos HTTP:
200/201 ok | 400 dado invalido | 401 sem token, token invalido/expirado ou login errado
403 perfil sem permissao | 404 nao encontrado | 409 e-mail ja cadastrado
422 regra de negocio recusada pelo banco (RAISE_APPLICATION_ERROR -20000..-20999,
    ex.: "Abrigo sem vagas suficientes") | 500 erro interno (detalhe so no log do servidor)


CHAMADAS AO BANCO (contrato com a Pessoa 4)
-------------------------------------------
Rota                          Rotina Oracle chamada pela API
----------------------------- --------------------------------------------------------------
POST /ocorrencias             PRC_REGISTRAR_OCORRENCIA(p_id_usuario IN NUMBER, p_tipo IN VARCHAR2,
                              p_descricao IN VARCHAR2, p_latitude IN NUMBER, p_longitude IN NUMBER,
                              p_foto_uri IN VARCHAR2, p_id_ocorrencia OUT NUMBER)
PATCH /ocorrencias/:id        UPDATE ocorrencia SET relatos = relatos + 1  -> dispara o TRIGGER
  (confirmar)                 que escala a prioridade com 3+ relatos na mesma area
GET /abrigos/proximo          FN_ABRIGO_MAIS_PROXIMO(p_latitude IN NUMBER, p_longitude IN NUMBER)
                              RETURN NUMBER  (id do abrigo com vaga mais perto, ou NULL)
PATCH /abrigos/:id/vagas      PRC_CONTROLE_VAGAS(p_id_abrigo IN NUMBER, p_quantidade IN NUMBER)
POST /ajuda/encerrar-antigos  PRC_ENCERRAR_PEDIDOS_ANTIGOS(p_dias IN NUMBER, p_qtd_encerrados OUT NUMBER)

Tabelas usadas pela API (nomes das colunas):
- USUARIO      (id, nome, email UNIQUE, senha_hash VARCHAR2(60+), bairro, perfil)
- OCORRENCIA   (id, tipo, descricao, latitude, longitude, status, prioridade, relatos, bairro,
                foto_uri, criada_em)
- ABRIGO       (id, nome, endereco, latitude, longitude, capacidade, vagas_ocupadas)
- PEDIDO_AJUDA (id, id_usuario, modo, categoria, descricao, urgencia, status, latitude,
                longitude, criado_em)
- CHECKIN      (id, id_usuario, status, latitude, longitude, criado_em)
Ids gerados pelo banco (IDENTITY ou sequence + trigger). Valores de status/prioridade em
minusculo, iguais aos do app ('aberta', 'em_atendimento', 'critica', 'aguardando'...).
Se algum nome no banco for diferente, ajuste so em api/src/repositorio.js (todo o SQL esta la).
Passo a passo detalhado para implementar as rotinas: banco/INSTRUCOES_PESSOA4.txt


FUNCOES E METODOS (codigo)
--------------------------
api/src/server.js      Ponto de entrada. Le o .env (process.loadEnvFile), confere variaveis
                       obrigatorias, abre o pool do Oracle e sobe o Express em 0.0.0.0:PORT.
api/src/db.js          iniciar()  -> cria o pool de conexoes (poolMin 1, poolMax 10)
                       execute(sql, binds) -> pega conexao do pool, executa, sempre devolve
                       encerrar() -> fecha o pool (Ctrl+C)
api/src/repositorio.js criarRepositorio(execute) -> objeto com todo o acesso ao banco:
                       buscarUsuarioPorEmail, criarUsuario, listarOcorrencias,
                       registrarOcorrencia (procedure), confirmarOcorrencia (trigger),
                       alterarStatusOcorrencia, listarAbrigos, abrigoMaisProximo (function),
                       controlarVagas (procedure), listarPedidos, criarPedido,
                       encerrarPedidosAntigos (procedure), registrarCheckin, ultimaPosicao,
                       indicadores. Sempre com bind variables (:nome) -> sem SQL injection.
api/src/app.js         criarApp({repo, segredo, expiraEm}) -> monta as rotas Express.
                       sessao(usuario)      gera o JWT (HS256, sub=id, perfil, expira em 8h)
                       middleware JWT       valida "Bearer <token>" e preenche req.usuario
                       soVoluntario(req)    bloqueia acoes de voluntario (403)
                       exigir/falha         validacao de entrada (400) e erros HTTP
                       distanciaKm          formula de Haversine (mesma do app)
                       formatarDistancia    "300 m" / "1,2 km"
                       pedidoParaApp        remove lat/lng do pedido e inclui "distancia"
                       tratador de erros    ORA-20xxx -> 422, ORA-00001 -> 409, resto -> 500

Seguranca:
- Senha com bcrypt (custo 10, salt aleatorio); so o hash vai para o banco.
- Login com mensagem unica para e-mail inexistente e senha errada, e mesmo tempo de
  resposta nos dois casos (nao revela quem tem conta).
- JWT assinado com JWT_SECRET (minimo 32 caracteres), algoritmo fixo HS256, expira em 8h.
- Todo SQL com bind variables. Corpo JSON limitado a 100 KB. Validacao de todos os campos.
- .env fora do Git (.gitignore). Erros internos nao vazam detalhes para o cliente.


JUSTIFICATIVA DO NODE.JS
------------------------
- Mesma linguagem do app (JavaScript/TypeScript): a equipe le e mexe nos dois lados, e os
  modelos de dados (Ocorrencia, Abrigo...) tem o mesmo formato JSON nas duas pontas.
- Modelo assincrono (event loop): a API passa a maior parte do tempo esperando o Oracle;
  o Node atende muitas requisicoes ao mesmo tempo sem criar uma thread por usuario, bom
  para picos de acesso durante uma enchente.
- node-oracledb e o driver oficial da Oracle, com pool de conexoes e chamada direta de
  procedures/functions (BEGIN ... END; com binds IN/OUT). No modo "thin" nao precisa
  instalar o Oracle Instant Client.
- Express: pouco codigo para criar rotas REST; JSON e nativo do JavaScript.
- Ecossistema maduro para seguranca: bcryptjs (hash de senha) e jsonwebtoken (JWT).
- Testes com o runner nativo do Node (node:test) e fetch nativo: nenhuma dependencia extra.

Dependencias: express 5, oracledb, bcryptjs, jsonwebtoken (nada mais).


LIMITES CONHECIDOS
------------------
- Listas sem paginacao (ultimas 200 ocorrencias/pedidos).
- fotoUri e o caminho da foto no celular; a API guarda o texto, nao recebe o arquivo.
- O teste automatico (npm test) usa um banco em memoria; o teste contra o Oracle real
  depende das tabelas e rotinas da pasta banco/ (veja "Teste de integracao contra a API REAL").


############################################################
# 3. BANCO
############################################################

ALERTABAIRRO - BANCO (Oracle)
=============================

Pasta do banco de dados. Os scripts sao das Pessoas 3 (modelagem) e 4 (automacao PL/SQL).

Arquivos esperados aqui:
- DDL das tabelas (USUARIO, OCORRENCIA, ABRIGO, PEDIDO_AJUDA, CHECKIN) e carga inicial
- Rotinas PL/SQL (Pessoa 4):
    PRC_REGISTRAR_OCORRENCIA, TRIGGER de escalonamento de prioridade,
    FN_ABRIGO_MAIS_PROXIMO, PRC_CONTROLE_VAGAS, PRC_ENCERRAR_PEDIDOS_ANTIGOS
- Script de testes das rotinas

Assinaturas, colunas, codigos de erro e como testar com a API:
veja banco/INSTRUCOES_PESSOA4.txt (passo a passo para a Pessoa 4).

[PESSOA 3/4: substituam este texto pelo README do banco (como rodar e testar as rotinas).]
