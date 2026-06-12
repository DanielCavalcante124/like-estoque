# Segurança - Assert interno em RPCs readonly Dashboard e Histórico

Data: 2026-06-12

## Objetivo

Adicionar validação interna de permissão em duas RPCs de leitura `SECURITY DEFINER`:

```text
rpc_dashboard_operacional()
rpc_historico_equipamento(uuid)
```

## Problema identificado

As duas RPCs eram executáveis por `authenticated`, não por `anon/public`, mas não tinham `app_assert_*` interno claro.

Por serem `SECURITY DEFINER`, poderiam bypassar RLS e entregar dados de leitura a qualquer usuário logado que chamasse a API diretamente.

## Correção aplicada

Migration aplicada:

```text
security_assert_readonly_dashboard_historico_20260612
```

Foi adicionada validação interna:

```sql
public.app_assert_permission('consulta')
```

Como as funções eram `LANGUAGE sql`, a validação foi inserida via CTE `auth_check` e referenciada na consulta final, garantindo execução antes do retorno.

## Validação pós-migration

Consulta de catálogo confirmou para as duas funções:

```text
security_definer = true
authenticated_execute = true
anon_execute = false
public_execute = false
has_consulta_assert = true
has_auth_check_cte = true
```

## Segurança operacional

Nenhum dado foi alterado.

Nenhuma tabela foi alterada.

Nenhum arquivo frontend foi alterado.

A alteração foi apenas DDL na definição de duas RPCs de leitura.

## Impacto esperado

Usuários sem permissão `consulta` não devem conseguir chamar diretamente:

```text
rpc_dashboard_operacional
rpc_historico_equipamento
```

Usuários com permissão `consulta` devem continuar usando Dashboard e Histórico normalmente.

## Teste recomendado

Após Ctrl+F5:

```text
1. Entrar com usuário autorizado.
2. Abrir Dashboard.
3. Confirmar que KPIs e auditoria preventiva carregam.
4. Abrir Histórico.
5. Selecionar equipamento.
6. Confirmar que a linha do tempo carrega.
```

## Acertos registrados

```text
1. Primeiro diagnosticar função por catálogo e corpo.
2. Não bloquear RPC carregada por frontend.
3. Não alterar retorno usado pela tela.
4. Em função SQL, garantir que a checagem seja referenciada para não ser ignorada.
5. Validar grants e presença do assert após migration.
```

## Erros a evitar

```text
1. Colocar CTE de checagem sem referenciar na query final.
2. Trocar permissão para uma muito restritiva sem testar perfis reais.
3. Converter função de leitura grande para plpgsql sem necessidade.
4. Reescrever toda função manualmente quando é possível patch controlado.
```

## Rollback

Caso algum perfil legítimo perca acesso indevidamente, opções:

```text
1. Ajustar o perfil para incluir permissão consulta.
2. Trocar o assert para uma permissão equivalente mais adequada.
3. Reverter a definição anterior da função usando backup/migração reversa.
```
