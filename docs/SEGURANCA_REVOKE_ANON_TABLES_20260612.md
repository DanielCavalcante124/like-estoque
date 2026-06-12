# Segurança - Revogação de grants anon nas tabelas de produção

Data: 2026-06-12

## Objetivo

Reduzir superfície de ataque removendo permissões diretas do papel `anon` nas tabelas principais de produção.

## Falha identificada

Várias tabelas estavam com RLS ativado, sem policies para `anon/public`, mas ainda possuíam grants diretos para `anon`:

```text
audit_log
descartes_autorizados
equipamentos
inventario
inventarios_bips
inventarios_contagens
inventarios_materiais_contagens
locais
materiais_movimentos
materiais_saldos
modelos
movimentos
pendencias_tecnico
produto_marcas
produto_tipos
tecnicos
user_profiles
```

## Risco

No estado anterior, a RLS bloqueava leitura anônima, mas o grant direto para `anon` era uma fragilidade de defesa em profundidade.

Se no futuro alguém criasse uma policy aberta por engano, o `anon` já teria permissão de tabela e poderia passar a acessar dados.

## Correção aplicada

Migration aplicada:

```text
security_revoke_anon_table_grants_20260612
```

Foram executados `REVOKE ALL ON TABLE ... FROM anon` nas 17 tabelas listadas.

## Validação pós-migration

Consulta de catálogo confirmou para todas as tabelas:

```text
anon_select = false
anon_insert = false
anon_update = false
anon_delete = false
```

E também confirmou que `authenticated` continuou com permissões de tabela:

```text
auth_select = true
auth_insert = true
auth_update = true
auth_delete = true
```

A autorização real para usuários logados continua controlada por RLS e pelas policies existentes.

## Segurança operacional

Nenhum dado foi alterado.

Nenhuma RPC foi alterada.

Nenhum arquivo frontend foi alterado.

A alteração foi apenas DDL de permissão.

## Acerto registrado

Antes de aplicar a migration, foi feito diagnóstico:

```text
1. Verificação dos grants anon.
2. Verificação de RLS ativo.
3. Verificação de inexistência de policy anon/public.
4. Aplicação apenas de REVOKE no papel anon.
5. Validação pós-migration.
```

## Erro a evitar futuramente

Não confundir `grant de tabela para anon` com vazamento confirmado.

Neste caso, a RLS bloqueava o acesso anônimo, mas o grant ainda era uma fragilidade de hardening.

A correção correta foi reduzir a superfície sem alterar policies nem regras operacionais.

## Próximo hardening recomendado

```text
Revogar EXECUTE anon/public da função app_inventario_equipamento_no_escopo_7a5.
```
