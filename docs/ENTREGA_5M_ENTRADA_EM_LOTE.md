# Entrega 5M - Entrada em lote com MAC/SN

Data: 2026-06-07

## Backend criado

- rpc_registrar_entrada_equipamento_lote(jsonb, uuid)

## Backend usado internamente

- rpc_registrar_entrada_equipamento

## Regras da RPC de lote

- Exige usuário autenticado com permissão operacional.
- Recebe uma lista JSON de equipamentos.
- Limite de 200 itens por lote.
- Bloqueia MAC duplicado dentro do lote.
- Bloqueia Serial/SN duplicado dentro do lote.
- Bloqueia MAC já cadastrado ativo no banco.
- Bloqueia Serial/SN já cadastrado ativo no banco.
- Chama a RPC individual segura para cada item.
- Retorna linha, id, código, MAC e Serial/SN.

## Testes de backend

### Lote válido

Teste em rollback com 2 itens.

Resultado:

- linha 1 gerou código
- linha 2 gerou código
- rollback executado

### Duplicidade no lote

Teste com MAC duplicado.

Resultado:

- RPC bloqueou com erro: Existem MACs duplicados dentro do lote.

## Frontend criado

- clean/entrada_lote.js

## Frontend atualizado

- index-clean.html

## Recursos da tela

- Menu Entrada em lote.
- Seleção de produto/modelo.
- Preenchimento automático de tipo, marca, modelo e custo.
- Local de entrada.
- Custo unitário.
- Fornecedor.
- NF/documento.
- Responsável.
- Observação.
- Campo para colar lista de MAC/SN.
- Pré-validação visual.
- Indicadores de linhas válidas, duplicadas, já cadastradas e custo total.
- Resultado com códigos gerados.

## Formato aceito

Um item por linha:

MAC, SERIAL
MAC
SERIAL

Separadores aceitos:

- vírgula
- ponto e vírgula
- tab
- barra vertical

## Como testar

Abrir:

/index-clean.html?v=5m

1. Fazer login.
2. Abrir Entrada em lote.
3. Selecionar produto/modelo.
4. Colar uma lista de MAC/SN.
5. Clicar em Pré-validar lote.
6. Corrigir duplicidades se houver.
7. Clicar em Registrar lote.
8. Conferir códigos gerados.
9. Conferir em Equipamentos e Histórico.

## Status

Implementado na rota limpa.
