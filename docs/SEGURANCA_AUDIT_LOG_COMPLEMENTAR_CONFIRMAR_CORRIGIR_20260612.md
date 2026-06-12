# Segurança - Audit log complementar em Confirmar instalação e Correção de local

Data: 2026-06-12

## Objetivo

Adicionar trilha administrativa complementar em `audit_log` para duas ações críticas de equipamento:

```text
rpc_confirmar_instalacao_cliente
rpc_corrigir_local_divergente_5v21
```

## Motivo

As duas ações já registravam trilha operacional em `movimentos`, mas não possuíam registro complementar direto em `audit_log`.

A melhoria aumenta a capacidade de investigação sem alterar o fluxo principal.

## Migration aplicada

```text
security_audit_log_confirmar_instalacao_corrigir_local_20260612
```

## Alterações aplicadas

### rpc_confirmar_instalacao_cliente

Foi adicionado `insert into public.audit_log` após o registro do movimento.

Resumo gravado inclui:

```text
Código
Status final
Cliente
OS
Técnico anterior
Movimento gerado
Client operation id
```

### rpc_corrigir_local_divergente_5v21

Foi adicionado `insert into public.audit_log` após o registro do movimento.

Resumo gravado inclui:

```text
Código
Local anterior
Local corrigido
Status
Responsável
Motivo
Movimento gerado
Client operation id
```

## Validação pós-migration

Consulta de catálogo confirmou para as duas funções:

```text
security_definer = true
authenticated_execute = true
anon_execute = false
public_execute = false
writes_audit_log = true
uses_auth_uid = true
has_stock_assert = true
keeps_movimento_insert = true
```

Observação:

```text
rpc_confirmar_instalacao_cliente retorna variável v_result em vez de return jsonb_build_object direto. Isso foi preservado e não é erro.
```

## Segurança operacional

Nenhum frontend foi alterado.

Nenhuma tabela foi alterada.

Nenhum dado real foi modificado durante a validação.

Nenhum retorno de RPC foi alterado.

A alteração foi apenas DDL na definição das duas RPCs.

## Estabilidade

A melhoria não cria trigger genérico em tabela grande.

A melhoria não duplica payload pesado.

O `audit_log` grava somente resumo textual curto.

A trilha operacional principal continua sendo `movimentos`.

## Escalabilidade

A escolha foi inserir log apenas nas duas ações críticas, evitando aumentar carga em todas as movimentações.

Se no futuro o volume crescer muito, pode-se avaliar particionamento/limpeza controlada de `audit_log`, mas não é necessário agora.

## Teste recomendado

Após Ctrl+F5:

```text
1. Testar Confirmar instalação apenas com caso real.
2. Testar Correção de local apenas se existir divergência real na Auditoria.
3. Validar que a tela continua retornando sucesso.
4. Validar no audit_log se apareceu resumo administrativo.
```

## Acertos registrados

```text
1. Usar movimentos como trilha operacional principal.
2. Usar audit_log como trilha administrativa complementar.
3. Não criar trigger genérico pesado.
4. Não alterar retorno das RPCs.
5. Não alterar frontend sem necessidade.
6. Validar catálogo depois da migration.
```

## Erros a evitar

```text
1. Duplicar logs com payload grande.
2. Criar audit_log para tudo sem necessidade e perder performance.
3. Alterar várias RPCs críticas ao mesmo tempo.
4. Tratar audit_log como substituto de movimentos.
5. Fazer teste real em equipamento sem necessidade operacional.
```

## Próxima melhoria recomendada

```text
Diagnóstico específico de idempotência amigável para client_operation_id.
```

Motivo:

```text
O banco já bloqueia duplicidade por índice único, mas algumas RPCs podem retornar erro técnico em clique duplo/reenvio em vez de resposta amigável.
```
