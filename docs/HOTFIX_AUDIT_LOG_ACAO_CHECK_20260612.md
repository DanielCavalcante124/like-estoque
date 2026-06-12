# Hotfix - audit_log_acao_check

Data: 2026-06-12

## Erro identificado em produção

Ao confirmar uma instalação, o usuário recebeu o erro:

```text
new row for relation "audit_log" violates check constraint "audit_log_acao_check"
```

## Causa

Na melhoria anterior de audit_log complementar, foram usados valores específicos na coluna `audit_log.acao`:

```text
confirmar_instalacao_cliente
corrigir_local_divergente
```

Esses valores não eram permitidos pela constraint `audit_log_acao_check`.

A constraint aceita apenas:

```text
insert
update
delete_bloqueado
baixa_logica
rpc
security
```

## Correção aplicada

Foram corrigidas as duas RPCs afetadas:

```text
rpc_confirmar_instalacao_cliente
rpc_corrigir_local_divergente_5v21
```

Agora elas gravam:

```text
acao = rpc
```

E mantêm o nome específico da operação dentro do campo `resumo`:

```text
RPC: confirmar_instalacao_cliente
RPC: corrigir_local_divergente
```

## Migrations aplicadas

```text
fix_audit_log_acao_confirmar_corrigir_20260612_v2
fix_audit_log_acao_corrigir_local_20260612
```

## Validação pós-correção

Consulta de catálogo confirmou para as duas funções:

```text
authenticated_execute = true
anon_execute = false
public_execute = false
keeps_audit_log = true
uses_allowed_action_rpc = true
keeps_specific_summary = true
has_stock_assert = true
```

## Impacto do erro original

Como o erro ocorreu dentro da RPC, a transação do PostgreSQL é abortada.

Na prática, a instalação que retornou esse erro provavelmente não foi efetivada, pois o update do equipamento, o movimento e o audit_log fazem parte da mesma chamada.

O usuário deve tentar confirmar novamente após este hotfix.

## Segurança operacional

Nenhuma tabela foi alterada.

Nenhum frontend foi alterado.

A correção foi apenas ajuste da definição das RPCs para obedecer à constraint existente.

## Erro registrado

Antes de adicionar valores novos em coluna com CHECK constraint, consultar obrigatoriamente:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.audit_log'::regclass;
```

## Acerto registrado

O valor específico da ação deve ficar no `resumo`, não na coluna `acao`, quando a coluna tem enum/check controlado.

Padrão correto:

```text
audit_log.acao = rpc
audit_log.resumo = RPC: nome_da_operacao | demais detalhes
```

## Regra para próximas melhorias

Antes de alterar qualquer insert em tabela com constraints:

```text
1. Consultar constraints.
2. Consultar colunas obrigatórias.
3. Validar valores permitidos.
4. Só depois aplicar migration.
```
