# Segurança - Hardening da RPC Confirmar instalação

Data: 2026-06-12

## Objetivo

Adicionar validação interna de permissão na RPC:

```text
rpc_confirmar_instalacao_cliente
```

## Falha identificada

A função era `SECURITY DEFINER`, executável por `authenticated`, e alterava dados reais de estoque:

```text
status do equipamento
local/cliente atual
OS atual
técnico atual
movimento de histórico
```

Porém, no início do corpo da função não havia checagem explícita de permissão operacional.

## Risco

Um usuário logado poderia tentar chamar a RPC diretamente pela API, fora da interface, caso tivesse acesso ao código e a um ID válido de equipamento.

Impacto possível:

```text
marcar equipamento como instalado indevidamente
limpar técnico atual
gerar histórico falso
alterar rastreabilidade operacional
```

## Correção aplicada

Migration aplicada no Supabase:

```text
security_assert_confirmar_instalacao_cliente_20260612
```

Foi adicionada a validação logo no início do `begin`:

```sql
perform public.app_assert_can_operate_stock();
```

## Preservado

A lógica original foi preservada:

```text
validação de cliente obrigatório
validação de OS obrigatória
FOR UPDATE no equipamento
validação de status permitido
gravação em equipamentos
gravação em movimentos
retorno jsonb do equipamento atualizado
```

## Validação pós-migration

Consulta de catálogo confirmou:

```text
security_definer = true
authenticated_execute = true
anon_execute = false
public_execute = false
has_stock_assert = true
keeps_row_lock = true
keeps_movement_insert = true
```

## Banco de dados

Não foi executada confirmação real de instalação.

Não houve alteração de equipamento durante a validação.

A alteração foi somente DDL na definição da função.

## Teste recomendado

Após Ctrl+F5:

```text
1. Entrar com usuário operacional autorizado.
2. Abrir Confirmar instalação.
3. Validar que a tela carrega.
4. Se houver equipamento real para confirmar, testar apenas com caso verdadeiro.
5. Validar que usuário sem permissão operacional não consegue usar o fluxo.
```

## Severidade corrigida

```text
CRÍTICA
```

## Próximo hardening recomendado

```text
Revogar grants anon das tabelas de produção como defesa em profundidade.
```
