# Segurança - Bloqueio de RPCs de diagnóstico/documentação

Data: 2026-06-12

## Objetivo

Reduzir exposição de RPCs `SECURITY DEFINER` que estavam executáveis por usuários autenticados, mas não eram usadas pelo frontend atual nem por outras funções públicas do banco.

## Regra aplicada

Esta etapa seguiu a regra aprendida após o erro `permission denied for function app_has_permission`:

```text
1. Buscar no GitHub antes de bloquear.
2. Confirmar que não existe chamada em front ativo.
3. Confirmar no banco que nenhuma outra função pública depende delas.
4. Aplicar REVOKE somente em lote pequeno e de baixo risco.
5. Validar permissões pós-migration.
6. Rodar Advisor.
7. Preservar RPCs operacionais e funções auxiliares app_*.
```

## Busca no GitHub

Busca realizada no repositório `DanielCavalcante124/like-estoque` para:

```text
rpc_diagnostico_leitura_perfil_6f
rpc_diagnostico_policies_antigas_6f
rpc_marco_fase_7a
rpc_revisao_final_producao_6g
rpc_registrar_versao_estavel_6g
```

Resultado:

```text
Nenhuma ocorrência encontrada no frontend ou arquivos do repositório.
```

## Dependência no banco

Foi verificado se outras funções públicas chamavam essas RPCs.

Resultado:

```text
Nenhuma função pública dependente encontrada.
```

## Migration aplicada

Migration:

```text
security_revoke_diagnostic_documentation_rpcs_20260612
```

SQL aplicado:

```sql
revoke execute on function public.rpc_diagnostico_leitura_perfil_6f() from authenticated;
revoke execute on function public.rpc_diagnostico_policies_antigas_6f() from authenticated;
revoke execute on function public.rpc_marco_fase_7a() from authenticated;
revoke execute on function public.rpc_revisao_final_producao_6g() from authenticated;
revoke execute on function public.rpc_registrar_versao_estavel_6g(text, text) from authenticated;
```

## Validação pós-migration

Resultado esperado e validado:

```text
rpc_diagnostico_leitura_perfil_6f: authenticated=false, anon=false, public=false
rpc_diagnostico_policies_antigas_6f: authenticated=false, anon=false, public=false
rpc_marco_fase_7a: authenticated=false, anon=false, public=false
rpc_revisao_final_producao_6g: authenticated=false, anon=false, public=false
rpc_registrar_versao_estavel_6g: authenticated=false, anon=false, public=false
```

RPCs operacionais principais preservadas:

```text
rpc_usuario_contexto_6a1: authenticated=true, anon=false
rpc_pesquisar_equipamentos_7a5: authenticated=true, anon=false
rpc_relatorio_gerencial_7a5: authenticated=true, anon=false
rpc_materiais_painel_7a5: authenticated=true, anon=false
rpc_entrada_material: authenticated=true, anon=false
rpc_saida_material_tecnico: authenticated=true, anon=false
rpc_consumo_material_tecnico: authenticated=true, anon=false
rpc_dashboard_operacional: authenticated=true, anon=false
```

## Advisor

Após a migration, o Advisor não listou mais as 5 RPCs bloqueadas.

Continuam pendentes alertas esperados para:

```text
1. Funções auxiliares app_* que o sistema ainda depende.
2. RPCs operacionais reais usadas pelo frontend.
3. Tabelas teste_* em quarentena com RLS sem policy.
4. Proteção contra senhas vazadas no Supabase Auth.
```

## Decisão técnica

Estas RPCs podem permanecer bloqueadas:

```text
rpc_diagnostico_leitura_perfil_6f
rpc_diagnostico_policies_antigas_6f
rpc_marco_fase_7a
rpc_revisao_final_producao_6g
rpc_registrar_versao_estavel_6g
```

Não bloquear novamente funções auxiliares `app_*` sem refatoração para schema interno.

## Teste recomendado

Como nenhuma RPC operacional foi alterada, o teste manual recomendado é regressão leve:

```text
Login
Dashboard
Relatórios
Fechamento
Materiais
Equipamentos
```

Se esses fluxos abrirem normalmente, a etapa está validada.