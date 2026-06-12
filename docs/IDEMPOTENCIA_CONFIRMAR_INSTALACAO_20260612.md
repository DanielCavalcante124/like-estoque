# Idempotência amigável - Confirmar instalação

Data: 2026-06-12

## Objetivo

Adicionar resposta idempotente amigável na RPC:

```text
rpc_confirmar_instalacao_cliente
```

## Problema

A função já usava `client_operation_id` e a tabela `movimentos` possui índice único parcial para impedir duplicidade.

Porém, em caso de clique duplo/reenvio, o banco poderia bloquear duplicidade com erro técnico.

## Correção aplicada

Migration aplicada:

```text
idempotencia_confirmar_instalacao_cliente_20260612
```

Foi adicionada checagem no início da função:

```text
Se p_client_operation_id já existir em movimentos:
  verificar se pertence ao mesmo equipamento
  verificar se o tipo é Confirmar instalação
  retornar sucesso idempotente
  não gravar novo movimento
  não alterar equipamento novamente
```

## Proteção contra UUID reutilizado indevidamente

Se o mesmo `client_operation_id` for encontrado em outro equipamento ou outro tipo de operação, a função retorna erro:

```text
client_operation_id já usado em outra operação.
```

Isso evita sucesso falso para operação diferente.

## Retorno idempotente

O retorno idempotente contém:

```text
ok=true
acao=idempotente
mensagem
equipamento_id
movimento_id
codigo
status
cliente
os
client_operation_id
```

## Preservado

A função manteve:

```text
app_assert_can_operate_stock
SECURITY DEFINER
bloqueio de anon/public
FOR UPDATE no fluxo normal
insert em movimentos no fluxo normal
insert em audit_log no fluxo normal
retorno normal por to_jsonb(v_eq)
```

## Validação pós-migration

Consulta de catálogo confirmou:

```text
security_definer = true
authenticated_execute = true
anon_execute = false
public_execute = false
has_stock_assert = true
protects_reused_uuid = true
has_idempotent_return = true
keeps_movimento_insert = true
keeps_audit_log_insert = true
keeps_row_lock = true
```

## Frontend

A tela `clean/confirmar_instalacao.js` usa apenas `result?.codigo` no retorno.

Portanto o retorno idempotente não deve quebrar a tela.

## Segurança operacional

Nenhum frontend foi alterado.

Nenhuma tabela foi alterada.

Nenhum dado real foi alterado durante validação.

A alteração foi apenas DDL na definição da RPC.

## Teste recomendado

Não é necessário confirmar uma instalação real apenas para testar.

Quando houver caso real:

```text
1. Confirmar instalação normalmente.
2. Se ocorrer reenvio por instabilidade/clique duplo, o sistema não deve duplicar movimento.
3. A tela deve continuar exibindo mensagem de sucesso.
```

## Acertos registrados

```text
1. Começar por função pequena e isolada.
2. Não mexer em materiais ou operação rápida primeiro.
3. Não usar client_operation_id nulo como chave.
4. Validar se o UUID pertence ao mesmo equipamento e tipo.
5. Preservar retorno normal usado pela tela.
6. Preservar audit_log e movimentos.
```

## Erros a evitar

```text
1. Retornar sucesso idempotente para UUID usado em outro equipamento.
2. Remover constraint única para evitar erro.
3. Alterar frontend sem necessidade.
4. Aplicar idempotência em massa.
5. Testar em produção com instalação falsa.
```

## Próxima melhoria recomendada

Após validação em uso real, aplicar o mesmo padrão em:

```text
rpc_registrar_saida_equipamento_core
```

Motivo:

```text
Saída é uma operação diária e sensível a clique duplo/reenvio.
```
