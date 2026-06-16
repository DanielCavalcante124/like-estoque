# Retorno da filial para Estoque central

Data: 2026-06-16

## Decisão de modelagem

O retorno da filial é o fluxo inverso da transferência para filial.

Não é baixa, não é devolução comum de técnico e não é correção manual.

## Regra oficial

Equipamento elegível para retorno:

```text
status = Em filial
local = Filial - Posse GO ou outra filial selecionada
ativo = true
```

Ao retornar:

```text
status = Em estoque
local = Estoque central
ativo = true
tecnico_atual = null
cliente_atual = null
os_atual = null
motivo_atual = Retorno de filial
```

No histórico:

```text
tipo = Retorno de filial
origem = filial selecionada
destino = Estoque central
responsavel = responsável pelo recebimento
os/documento = documento/remessa informado
motivo = Retorno de filial
```

## RPC criada

```text
rpc_retornar_equipamentos_filial(uuid[], text, text, text, text, uuid)
```

A RPC:

```text
exige app_assert_can_operate_stock()
usa SECURITY DEFINER
usa search_path public
bloqueia anon/public
permite authenticated
valida filial/local de origem cadastrado
valida responsável obrigatório
valida documento/remessa obrigatório
permite somente status Em filial
exige que o local atual seja a filial informada
usa FOR UPDATE
mantém ativo = true
altera status para Em estoque
altera local para Estoque central
registra movimento Retorno de filial
registra audit_log com acao rpc
usa client_operation_id para idempotência
```

## Tela criada

Arquivo:

```text
clean/retorno_filial.js
```

Tela:

```text
Retorno da filial para estoque central
```

Campos:

```text
Filial de origem
Responsável pelo recebimento
Documento / remessa / OS de retorno
Observação
Busca de equipamento na filial
Carrinho de equipamentos
```

A tela gera:

```text
PDF do retorno
Texto WhatsApp
```

## Arquivo carregado no sistema

```text
clean/retorno_filial.js?v=1
```

## Teste operacional recomendado

```text
1. Transferir um equipamento teste para Filial - Posse GO.
2. Abrir Retorno filial.
3. Selecionar Filial - Posse GO.
4. Buscar o equipamento transferido.
5. Adicionar ao carrinho.
6. Informar responsável e documento/remessa.
7. Confirmar retorno.
8. Verificar PDF/WhatsApp.
9. Conferir equipamento:
   status = Em estoque
   local = Estoque central
   ativo = true
```

## Observação

Esta primeira versão é conservadora: só retorna equipamentos que realmente estão em filial.

Não permite retornar por esse fluxo equipamentos em técnico, cliente, manutenção, baixados ou em outro local.
