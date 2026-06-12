# Segurança - Revogação de EXECUTE anon/public em função auxiliar de inventário

Data: 2026-06-12

## Objetivo

Remover execução desnecessária por `anon` e `public` da função auxiliar:

```text
app_inventario_equipamento_no_escopo_7a5
```

## Diagnóstico antes da correção

A função estava com:

```text
security_definer = false
anon_execute = true
public_execute = true
authenticated_execute = true
```

Por não ser `SECURITY DEFINER`, ela não tinha o mesmo risco de escalar privilégio de uma RPC crítica.

Mesmo assim, não havia necessidade operacional para `anon` ou `public` executarem essa função auxiliar.

## Correção aplicada

Migration aplicada:

```text
security_revoke_anon_public_app_inventario_escopo_20260612
```

Comandos aplicados:

```sql
revoke execute on function public.app_inventario_equipamento_no_escopo_7a5(text, text, text, text, public.equipamentos) from anon;
revoke execute on function public.app_inventario_equipamento_no_escopo_7a5(text, text, text, text, public.equipamentos) from public;
grant execute on function public.app_inventario_equipamento_no_escopo_7a5(text, text, text, text, public.equipamentos) to authenticated;
```

## Validação pós-migration

Consulta de catálogo confirmou:

```text
security_definer = false
anon_execute = false
public_execute = false
authenticated_execute = true
```

## Segurança operacional

Nenhum dado foi alterado.

Nenhuma tabela foi alterada.

Nenhuma RPC operacional foi alterada.

Nenhum arquivo frontend foi alterado.

A mudança foi apenas DDL de permissão em uma função auxiliar.

## Acerto registrado

A correção foi limitada ao necessário:

```text
Revogar anon/public.
Preservar authenticated.
Não apagar função.
Não revogar dependência interna sem mapear uso.
```

## Erro a evitar futuramente

Não remover função auxiliar apenas porque aparece em diagnóstico de segurança.

Primeiro verificar:

```text
1. Se é SECURITY DEFINER.
2. Quem executa.
3. Se é usada por RPC interna.
4. Se precisa continuar para authenticated.
```

## Próximo hardening recomendado

Avaliar RPCs `SECURITY DEFINER` executáveis por `authenticated` que ainda aparecem no Advisor, separando:

```text
RPC operacional legítima
função auxiliar interna
RPC legada sem uso
```
