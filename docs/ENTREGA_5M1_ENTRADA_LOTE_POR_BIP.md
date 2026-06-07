# Entrega 5M.1 - Entrada em lote por bip

Data: 2026-06-07

## Objetivo

Adaptar a entrada em lote para operação com leitor de código de barras/bip.

## Arquivo alterado

- clean/entrada_lote.js

## Mudança principal

O fluxo antigo de colar lista foi substituído por pré-cadastro operacional:

1. Bipe ou digite o MAC.
2. Pressione Enter ou deixe o leitor enviar Enter.
3. O foco vai para o campo Serial/SN.
4. Bipe ou digite o Serial/SN.
5. Ao pressionar Enter no SN, o item é adicionado automaticamente ao pré-cadastro.
6. O lote só entra no sistema quando clicar em Finalizar entrada no sistema.

## Recursos adicionados

- Campo MAC atual.
- Campo Serial/SN atual.
- Botão Adicionar ao pré-cadastro.
- Grade de pré-cadastro antes de gravar no banco.
- Remoção de item do pré-cadastro.
- Pré-cadastro salvo no localStorage do navegador.
- Validação de duplicidade no pré-cadastro.
- Validação de MAC/SN já existente no sistema.
- KPIs: pré-cadastrados, válidos, com problema, custo total.

## Segurança

A gravação definitiva continua passando pela RPC:

- rpc_registrar_entrada_equipamento_lote

A tela não insere diretamente na tabela equipamentos.

## Observação técnica

A atualização de cache do index-clean.html para entrada_lote.js?v=2 foi bloqueada pela ferramenta. O arquivo clean/entrada_lote.js foi atualizado no repositório, mas em alguns navegadores pode ser necessário atualizar forçado ou abrir em aba anônima para baixar a versão nova.

## Como testar

Abrir:

/index-clean.html?v=5m1

1. Fazer login.
2. Abrir Entrada em lote.
3. Selecionar produto/modelo.
4. Bipe MAC.
5. Bipe SN.
6. Confirmar se entrou na grade de pré-cadastro.
7. Repetir com vários equipamentos.
8. Testar duplicidade.
9. Clicar em Finalizar entrada no sistema.
10. Conferir códigos gerados.
