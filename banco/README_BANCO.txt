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
