# Segurança - Bloqueio de RPCs admin/correção sem uso ativo

Data: 2026-06-12

## Objetivo

Reduzir exposição de RPCs `SECURITY DEFINER` antigas de correção/administração que não aparecem em frontend ativo nem são dependências internas de outras funções públicas.

## Lote analisado

```text
rpc_corrigir_local_divergente_5v21
rpc_corrigir_locais_divergentes_lote_5v24
rpc_editar_equipamento_admin
```

## Resultado da análise

### Mantida

```text
rpc_corrigir_local_divergente_5v21
```

Motivo: está em uso real na aba `Auditoria`, arquivo `clean/auditoria.js`, no fluxo `Correção guiada — Local inválido`.

A tela chama a RPC quando o usuário clica em `Corrigir local selecionado`.

Portanto, bloquear essa RPC quebraria a função de correção guiada da Auditoria.

### Bloqueadas

```text
rpc_corrigir_locais_divergentes_lote_5v24
rpc_editar_equipamento_admin
```

Motivo:

```text
1. Não apareceram em front ativo.
2. Apareceram apenas em documentação antiga.
3. Nenhuma outra função pública depende delas.
4. Ambas estavam expostas para authenticated como SECURITY DEFINER.
```

## Migration aplicada

Migration:

```text
security_revoke_unused_admin_correction_rpcs_20260612
```

SQL aplicado:

```sql
revoke execute on function public.rpc_corrigir_locais_divergentes_lote_5v24(text, text, text, boolean, integer, uuid) from authenticated;
revoke execute on function public.rpc_editar_equipamento_admin(uuid, text, text, text, text, text, text, numeric, text, uuid) from authenticated;
```

## Validação pós-migration

Resultado validado no catálogo do Postgres:

```text
rpc_corrigir_locais_divergentes_lote_5v24: authenticated=false, anon=false, public=false
rpc_editar_equipamento_admin: authenticated=false, anon=false, public=false
rpc_corrigir_local_divergente_5v21: authenticated=true, anon=false, public=false
```

## Advisor

O Supabase Advisor foi consultado após a migration.

Resultado relevante:

```text
rpc_corrigir_local_divergente_5v21 continua aparecendo no Advisor, como esperado, porque segue liberada para authenticated e é usada pela Auditoria.
rpc_corrigir_locais_divergentes_lote_5v24 não apareceu mais no Advisor.
rpc_editar_equipamento_admin não apareceu mais no Advisor.
```

## Decisão técnica

Estas RPCs podem permanecer bloqueadas:

```text
rpc_corrigir_locais_divergentes_lote_5v24
rpc_editar_equipamento_admin
```

Esta RPC deve permanecer liberada enquanto a aba Auditoria tiver correção guiada:

```text
rpc_corrigir_local_divergente_5v21
```

## Teste recomendado

Após Ctrl+F5, validar:

```text
Auditoria -> Gerar auditoria
Auditoria -> Corrigir local selecionado
Equipamentos -> Buscar equipamento
Equipamentos -> Histórico
Dashboard
Relatórios
```

## Regra reforçada

```text
Se uma RPC aparece em clean/*.js, mesmo que pareça antiga, não bloquear.
Primeiro entender o fluxo de tela e só depois decidir.
```
