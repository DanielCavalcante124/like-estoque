# Entrega 5D - RPC segura de edição de equipamento

Data: 2026-06-07

## Objetivo

Remover do front-end a responsabilidade de editar equipamento diretamente na tabela `equipamentos`.

## RPC criada

- `public.rpc_editar_equipamento_admin(...)`

## O que a RPC faz

- Valida permissão usando `app_assert_can_operate_stock()`.
- Bloqueia perfil sem permissão, como `consulta`.
- Bloqueia edição de equipamento baixado, inutilizado ou perdido.
- Atualiza status, local, técnico, cliente, OS, motivo e custo.
- Registra movimento do tipo `Edição manual administrativa`.
- Registra auditoria em `audit_log`.
- Usa `client_operation_id` para idempotência.
- Usa `SECURITY DEFINER` com `search_path=public`.

## Permissões

- `anon`: sem execução.
- `public`: sem execução.
- `authenticated`: execução permitida, com validação interna por perfil.

## Testes executados

### Admin

Teste em transação com rollback:

- RPC executada como usuário admin.
- Equipamento editado.
- Movimento criado.
- Auditoria criada.
- Rollback executado para não contaminar o banco.

Resultado:

- movimentos_por_operacao: 1
- auditorias: 1

### Consulta

Teste com perfil `consulta`:

- RPC bloqueada.
- Erro esperado: Permissão insuficiente para movimentar estoque.

## Status

Backend da etapa 5D aprovado.

## Próximo passo

Atualizar o front-end para substituir `editEq()` direto por chamada à RPC `rpc_editar_equipamento_admin`.

Observação: como a frente atual ainda tem conflito de patches, a integração visual deve ser feita apenas depois de estabilizar a arquitetura limpa.
