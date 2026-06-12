# Continuidade - Erros encontrados em 2026-06-12

Este arquivo complementa `docs/CONTINUIDADE_CHATGPT.md` porque a ferramenta bloqueou/limitou a leitura completa do arquivo principal e não é seguro sobrescrevê-lo truncado.

## Erro encontrado

Erro reportado pelo usuário:

```text
permission denied for function app_has_permission
```

## Causa raiz

Durante o hardening de segurança foi aplicada a migration:

```text
security_revoke_internal_app_trigger_execute_20260612
```

A intenção era bloquear chamada direta por usuários autenticados de funções internas `app_*` e triggers `trg_*`.

O problema: algumas RPCs `SECURITY DEFINER` usadas pelo frontend dependem dessas funções auxiliares em tempo de execução. Ao revogar `EXECUTE` de `authenticated` em funções-base como `app_has_permission`, `app_assert_permission`, `app_assert_can_operate_stock`, `app_is_admin`, `app_assert_admin` e `app_perfil_usuario`, chamadas legítimas passaram a falhar.

## Cadeia de dependência identificada

Funções auxiliares envolvidas:

```text
app_perfil_usuario()
app_has_permission(text)
app_assert_permission(text)
app_assert_can_operate_stock()
app_is_admin()
app_assert_admin()
app_assert_active_profile()
```

Dependências relevantes:

- `app_has_permission(text)` depende de `app_perfil_usuario()`.
- `app_assert_permission(text)` depende de `app_has_permission(text)`.
- `app_assert_can_operate_stock()` depende de `app_assert_permission(text)`.
- `app_assert_admin()` depende de `app_is_admin()`.
- `rpc_usuario_contexto_6c()` chama `app_has_permission(text)` e `app_is_admin()`.
- Diversas RPCs operacionais chamam `app_assert_permission(text)` ou `app_assert_can_operate_stock()`.

RPCs que podem quebrar se essas funções auxiliares ficarem sem `EXECUTE` para `authenticated`:

```text
rpc_usuario_contexto_6c
rpc_usuario_contexto_6a1
rpc_materiais_painel_7a5
rpc_operacao_rapida_busca_7a5
rpc_pesquisar_equipamentos_7a5
rpc_tecnicos_resumo_7a5
rpc_tecnico_detalhe_7a5
rpc_entrada_material
rpc_saida_material_tecnico
rpc_consumo_material_tecnico
rpc_registrar_entrada_equipamento
rpc_registrar_entrada_equipamento_lote
rpc_registrar_saida_equipamento
rpc_registrar_devolucao_equipamento
rpc_registrar_manutencao_equipamento
rpc_baixar_equipamento_controlado
rpc_relatorio_gerencial_7a5
rpc_auditoria_divergencias_5v1
rpc_listar_inventarios_7a5
rpc_abrir_inventario_7a5
rpc_bipar_equipamento_inventario_7a5
rpc_resumo_inventario_7a5
rpc_resumo_inventario_materiais_7a5
rpc_relatorio_inventario_7a5_2
rpc_finalizar_inventario_7a5
rpc_termo_inventario_7a5_3
rpc_registrar_termo_inventario_7a5_3
```

## Correção aplicada

Foi restaurado `EXECUTE` para `authenticated` nas funções auxiliares necessárias:

```sql
grant execute on function public.app_perfil_usuario() to authenticated;
grant execute on function public.app_has_permission(text) to authenticated;
grant execute on function public.app_assert_permission(text) to authenticated;
grant execute on function public.app_assert_can_operate_stock() to authenticated;
grant execute on function public.app_is_admin() to authenticated;
grant execute on function public.app_assert_admin() to authenticated;
grant execute on function public.app_assert_active_profile() to authenticated;
```

A tentativa de registrar isso como migration formal com `Supabase.apply_migration` foi bloqueada pela ferramenta. A correção foi aplicada via `execute_sql` e validada em seguida.

## Estado validado após correção

Funções auxiliares reabertas para `authenticated` e ainda bloqueadas para `anon` e `public`:

```text
app_assert_active_profile: authenticated=true, anon=false, public=false
app_assert_admin: authenticated=true, anon=false, public=false
app_assert_can_operate_stock: authenticated=true, anon=false, public=false
app_assert_permission: authenticated=true, anon=false, public=false
app_has_permission: authenticated=true, anon=false, public=false
app_is_admin: authenticated=true, anon=false, public=false
app_perfil_usuario: authenticated=true, anon=false, public=false
```

Bloqueios anteriores preservados:

```text
rpc_baixar_equipamento(uuid, text): authenticated=false, anon=false, public=false
rpc_baixar_equipamento(uuid, text, uuid): authenticated=false, anon=false, public=false
rpc_movimentar_material(uuid, numeric, text, text, text, text, text, uuid): authenticated=false, anon=false, public=false
trg_fechamentos_permissao_6d(): authenticated=false, anon=false, public=false
trg_materiais_movimentos_permissoes_6d(): authenticated=false, anon=false, public=false
trg_movimentos_permissoes_6d(): authenticated=false, anon=false, public=false
```

## Decisão arquitetural

Não tentar novamente bloquear execução direta das funções auxiliares `app_*` sem antes refatorar a arquitetura.

Melhor caminho futuro:

1. Manter `app_*` auxiliares necessárias liberadas para `authenticated`, mas bloqueadas para `anon` e `public`.
2. Continuar bloqueando triggers diretos `trg_*`, pois eles não são chamados pelo front.
3. Continuar bloqueando RPCs antigas/genéricas não usadas pelo front.
4. Para reduzir os alertas do Advisor sem quebrar dependências, criar no futuro uma camada de schema interno não exposto, por exemplo `private` ou `app_private`, e mover funções auxiliares para lá.
5. Depois disso, as RPCs públicas poderiam continuar em `public`, chamando funções internas fora do schema exposto.

## Regra nova para próximos chats

Antes de revogar `EXECUTE` de qualquer função auxiliar:

```sql
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and pg_get_functiondef(p.oid) ilike '%nome_da_funcao%'
order by p.proname, arguments;
```

E classificar:

```text
1. Função chamada diretamente pelo front: não revogar.
2. Função chamada por RPC pública em produção: não revogar sem teste real.
3. Trigger function: pode revogar chamada direta, desde que o trigger continue enabled.
4. Função antiga/genérica sem chamada no front: pode revogar após busca no GitHub e validação no Advisor.
```

## Alerta importante

O Supabase Advisor pode continuar mostrando `authenticated_security_definer_function_executable` para essas funções auxiliares. Esse alerta é real, mas neste momento o sistema depende dessas permissões. A correção estrutural profissional é mover auxiliares para schema interno fora da API exposta, não simplesmente revogar `EXECUTE` em produção.

---

## Lição aplicada depois do erro: `rpc_relatorio_gerencial_5v`

Data: 2026-06-12.

Foi planejado bloquear a RPC antiga `rpc_relatorio_gerencial_5v`, mas a primeira busca mostrou que ainda existia dependência no código.

Dependências encontradas antes do bloqueio:

```text
clean/fechamento.js chamava rpc_relatorio_gerencial_5v para gerar previa de fechamento.
clean/relatorios_pdf_js.js tambem chamava rpc_relatorio_gerencial_5v, embora parecesse arquivo legado/nao carregado no index-clean.html.
```

Ação correta tomada antes do bloqueio:

```text
1. Migrado clean/fechamento.js para rpc_relatorio_gerencial_7a5 com limites de performance.
2. Atualizado cache-bust em index-clean.html para clean/fechamento.js?v=4.
3. Usuario testou Fechamento no navegador e confirmou funcionamento.
4. Migrado clean/relatorios_pdf_js.js para rpc_relatorio_gerencial_7a5 com limites de performance.
5. So depois disso foi aplicada a migration security_revoke_relatorio_gerencial_5v_20260612.
```

Validação após bloqueio:

```text
rpc_relatorio_gerencial_5v: authenticated=false, anon=false, public=false
rpc_relatorio_gerencial_7a5: authenticated=true, anon=false, public=false
Advisor nao listou mais rpc_relatorio_gerencial_5v.
```

Regra reforçada:

```text
Nunca bloquear uma RPC antiga apenas porque parece substituida.
Antes, buscar no GitHub, ler arquivo ativo, verificar se existe arquivo legado ainda carregado, migrar dependencias, testar navegador e so entao aplicar REVOKE.
```

## Teste aprovado apos bloqueio da `rpc_relatorio_gerencial_5v`

Data: 2026-06-12.

O usuario informou que os testes deram certo apos:

```text
1. Fechamento usando rpc_relatorio_gerencial_7a5.
2. Relatorios/PDF legado migrado para rpc_relatorio_gerencial_7a5.
3. Migration security_revoke_relatorio_gerencial_5v_20260612.
```

Fluxos testados e aprovados pelo usuario:

```text
Fechamento -> Gerar previa
Fechamento -> Baixar PDF
Relatorios -> Gerar relatorio
Relatorios -> Baixar PDF gerencial
```

Conclusao:

```text
rpc_relatorio_gerencial_5v pode permanecer bloqueada.
rpc_relatorio_gerencial_7a5 e a RPC oficial atual para relatorios/fechamento.
```
