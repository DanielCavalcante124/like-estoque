# Segurança - Aposentadoria da tela Teste perfis

Data: 2026-06-12

## Objetivo

Aposentar a tela administrativa `Teste perfis` e bloquear as RPCs de teste/matriz 6E/6D que eram usadas apenas por essa tela.

## Motivo

O lote de RPCs de perfis inicialmente foi considerado candidato a bloqueio, mas a busca individual mostrou que ainda havia uso no frontend.

RPCs encontradas em uso antes da aposentadoria:

```text
rpc_validar_matriz_perfis_6e
rpc_listar_testes_perfis_6e
rpc_registrar_teste_perfil_6e
```

Arquivo que usava essas RPCs:

```text
clean/teste_perfis.js
```

Arquivo que carregava a tela:

```text
index-clean.html
```

## Regra aplicada

Esta etapa seguiu a regra aprendida com o erro `permission denied for function app_has_permission`:

```text
1. Não bloquear RPC ainda em uso.
2. Primeiro remover o carregamento do frontend.
3. Manter o arquivo legado no repositório para rollback simples.
4. Só depois revogar execução direta das RPCs aposentadas.
5. Validar no banco se as RPCs operacionais continuam liberadas.
```

## Alteração no frontend

Removido do `index-clean.html`:

```html
<script type="module" src="clean/teste_perfis.js?v=1"></script>
```

Decisão: o arquivo `clean/teste_perfis.js` não foi apagado, apenas deixou de ser carregado. Isso permite rollback rápido caso a tela precise voltar.

Commit da alteração no frontend:

```text
d3e9e759170f861ef2c40425d84b873fbc57b24b
```

## Migration aplicada

Migration:

```text
security_revoke_retired_profile_test_rpcs_20260612
```

SQL aplicado:

```sql
revoke execute on function public.rpc_validar_matriz_perfis_6e() from authenticated;
revoke execute on function public.rpc_listar_testes_perfis_6e(integer) from authenticated;
revoke execute on function public.rpc_registrar_teste_perfil_6e(text, uuid, text, text, text, jsonb) from authenticated;
revoke execute on function public.rpc_matriz_permissoes_6d() from authenticated;
```

## Validação pós-migration

Resultado validado no catálogo do Postgres:

```text
rpc_validar_matriz_perfis_6e: authenticated=false, anon=false, public=false
rpc_listar_testes_perfis_6e: authenticated=false, anon=false, public=false
rpc_registrar_teste_perfil_6e: authenticated=false, anon=false, public=false
rpc_matriz_permissoes_6d: authenticated=false, anon=false, public=false
```

RPCs reais de usuários/permissões preservadas:

```text
rpc_usuario_contexto_6c: authenticated=true, anon=false
rpc_usuario_contexto_6a1: authenticated=true, anon=false
rpc_perfis_disponiveis_6c: authenticated=true, anon=false
rpc_listar_usuarios_perfis_6c: authenticated=true, anon=false
rpc_salvar_usuario_perfil_6c: authenticated=true, anon=false
rpc_alterar_status_usuario_perfil_6c: authenticated=true, anon=false
```

## Advisor

A tentativa de consultar o Supabase Advisor após a migration foi bloqueada pela ferramenta de segurança da OpenAI.

Portanto, o Advisor não foi usado como fonte de validação nesta etapa.

Validação usada:

```text
1. Catálogo do Postgres para permissões.
2. Conferência do carregamento do frontend.
3. Preservação explícita das RPCs operacionais.
```

## Teste recomendado

Após Ctrl+F5, validar:

```text
Login
Dashboard
Usuários
Permissões
Materiais
Relatórios
Fechamento
Equipamentos
```

Também confirmar que o menu `Teste perfis` não aparece mais.

## Rollback seguro

Se for necessário restaurar a tela:

```text
1. Recolocar o script clean/teste_perfis.js?v=1 no index-clean.html.
2. Restaurar EXECUTE para authenticated nas RPCs aposentadas.
3. Testar login admin e tela Teste perfis.
```
