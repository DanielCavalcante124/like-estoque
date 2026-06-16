# Transferência para filial - Posse GO

Data: 2026-06-16

## Decisão de modelagem

Transferência para filial não é baixa.

O equipamento continua ativo, rastreável e vinculado ao local da filial.

## Nome oficial da filial

```text
Filial - Posse GO
```

## Regra oficial

Ao transferir equipamento do estoque central para filial:

```text
status = Em filial
local = Filial - Posse GO
ativo = true
tecnico_atual = null
cliente_atual = null
os_atual = documento/remessa
motivo_atual = Transferência para filial
```

No histórico:

```text
tipo = Transferência para filial
origem = Estoque central
destino = Filial - Posse GO
responsavel = responsável informado
os = documento/remessa
motivo = Transferência para filial
```

## Banco aplicado

Foi criado/cadastrado o local:

```text
Filial - Posse GO
tipo = Filial
ativo = true
```

Foram criadas tabelas de controle da remessa:

```text
transferencias_filiais
transferencias_filiais_itens
```

As tabelas têm RLS ativado e leitura apenas para authenticated.

## RPC criada

```text
rpc_transferir_equipamentos_filial(uuid[], text, text, text, text, uuid)
```

A RPC:

```text
exige app_assert_can_operate_stock()
usa SECURITY DEFINER
usa search_path public
bloqueia anon/public
permite authenticated
valida filial/local cadastrado
valida responsável obrigatório
valida documento/remessa obrigatório
permite somente Em estoque/Reservado nesta versão
permite somente local Estoque central nesta versão
usa FOR UPDATE
mantém ativo = true
altera status para Em filial
altera local para filial destino
registra movimentos
registra audit_log com acao rpc
usa client_operation_id para idempotência da transferência
```

## Tela criada

Arquivo:

```text
clean/transferencia_filial.js
```

Tela:

```text
Transferência para filial
```

Campos:

```text
Filial destino
Responsável pela retirada/envio
Documento / remessa / OS
Observação
Busca de equipamento
Carrinho de equipamentos
```

A tela gera:

```text
PDF da transferência
Texto WhatsApp
```

## Arquivo carregado no sistema

```text
clean/transferencia_filial.js?v=1
```

## Validação realizada

Validação sem movimentar equipamento real:

```text
local Filial - Posse GO criado
RLS ativo nas tabelas
policies SELECT para authenticated criadas
RPC SECURITY DEFINER criada
RPC com app_assert_can_operate_stock
RPC com FOR UPDATE
RPC com audit_log
RPC com idempotência por client_operation_id
RPC bloqueada para anon/public
RPC liberada para authenticated
```

## Pendente de teste operacional

Testar em navegador:

```text
abrir menu Transferência filial
buscar equipamento em Estoque central
adicionar ao carrinho
informar responsável e documento/remessa
confirmar transferência
verificar PDF/WhatsApp
verificar equipamento com status Em filial e local Filial - Posse GO
```

## Observação

A regra inicial é conservadora: só transfere equipamento que está em Estoque central com status Em estoque ou Reservado.

Equipamentos com técnico, cliente, manutenção ou baixados não são transferidos nesta primeira versão.
