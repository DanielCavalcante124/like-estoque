# CHANGELOG - LIKE Estoque

Todas as alterações relevantes do sistema devem ser registradas neste arquivo.

Formato adotado: versionamento semântico.

- `MAJOR`: mudança grande, quebra de compatibilidade ou reestruturação crítica.
- `MINOR`: nova funcionalidade ou reestruturação sem quebrar uso normal.
- `PATCH`: correção pequena, ajuste visual ou melhoria pontual.

---

## [1.1.26] - 2026-06-12

### Alterado

- Substituídos `confirm()` e `window.prompt()` da aba **Auditoria** por modal interno responsivo.
- Atualizado cache-bust do `index-clean.html` para `clean/auditoria.js?v=3`.
- Mantidas as mesmas RPCs da Auditoria, sem alteração no banco.

### Preservado

- `rpc_auditoria_divergencias_5v1`
- `rpc_corrigir_local_divergente_5v21`

### Validação

- Validado `node --check clean/auditoria.js` sem erro de sintaxe.
- Busca no GitHub não encontrou mais `alert`, `confirm` ou `prompt` em `clean/auditoria.js`.
- Documentado em `docs/UX_AUDITORIA_MODAL_20260612.md`.

---

## [1.1.25] - 2026-06-12

### Alterado

- Substituídos `alert()`, `confirm()` e `prompt()` da aba **Usuários** por modal interno responsivo.
- Atualizado cache-bust do `index-clean.html` para `clean/usuarios.js?v=2`.
- Mantidas as mesmas RPCs administrativas, sem alteração no banco.

### Preservado

- `rpc_usuario_contexto_6c`
- `rpc_perfis_disponiveis_6c`
- `rpc_listar_usuarios_perfis_6c`
- `rpc_salvar_usuario_perfil_6c`
- `rpc_alterar_status_usuario_perfil_6c`

### Validação

- Validado `node --check clean/usuarios.js` sem erro de sintaxe.
- Busca no GitHub não encontrou mais `alert`, `confirm` ou `prompt` em `clean/usuarios.js`.
- Usuário testou a tela Usuários e confirmou funcionamento correto.
- Documentado em `docs/UX_USUARIOS_MODAL_20260612.md`.

---

## [1.1.24] - 2026-06-12

### Alterado

- Substituídos `confirm()` e `prompt()` da aba **Fechamento** por modal interno responsivo.
- Atualizado cache-bust do `index-clean.html` para `clean/fechamento.js?v=5`.
- Mantidas as mesmas RPCs de fechamento, sem alteração no banco.

### Preservado

- `rpc_validar_periodo_fechamento_5w2`
- `rpc_relatorio_gerencial_7a5`
- `rpc_auditoria_divergencias_5v1`
- `rpc_criar_fechamento_operacional_5w`
- `rpc_cancelar_fechamento_operacional_5w1`
- `rpc_listar_fechamentos_operacionais_5w`

### Validação

- Validado `node --check clean/fechamento.js` sem erro de sintaxe.
- Busca no GitHub não encontrou mais `confirm` ou `prompt` em `clean/fechamento.js`.
- Usuário testou a aba Fechamento e confirmou funcionamento correto.
- Documentado em `docs/UX_FECHAMENTO_MODAL_20260612.md`.

---

## [1.1.23] - 2026-06-12

### Segurança

- Aplicada migration `security_revoke_unused_admin_correction_rpcs_20260612`.
- Bloqueada execução direta para `authenticated` das RPCs antigas sem uso ativo:
  - `rpc_corrigir_locais_divergentes_lote_5v24`
  - `rpc_editar_equipamento_admin`

### Preservado

- Mantida `rpc_corrigir_local_divergente_5v21`, pois a aba **Auditoria** ainda usa essa RPC no fluxo de correção guiada de local inválido.

### Validação

- Confirmado que as duas RPCs bloqueadas ficaram `authenticated=false`, `anon=false` e `public=false`.
- Confirmado que `rpc_corrigir_local_divergente_5v21` continuou `authenticated=true`, `anon=false` e `public=false`.
- Supabase Advisor deixou de listar as duas RPCs bloqueadas e continuou listando a RPC preservada, como esperado.
- Documentado em `docs/SEGURANCA_RPC_CORRECAO_ADMIN_20260612.md`.

---

## [1.1.22] - 2026-06-12

### Segurança

- Aposentada a tela **Teste perfis**.
- Removido carregamento de `clean/teste_perfis.js?v=1` do `index-clean.html`.
- Arquivo `clean/teste_perfis.js` preservado no repositório para rollback.
- Aplicada migration `security_revoke_retired_profile_test_rpcs_20260612`.

### Bloqueado

- `rpc_validar_matriz_perfis_6e`
- `rpc_listar_testes_perfis_6e`
- `rpc_registrar_teste_perfil_6e`
- `rpc_matriz_permissoes_6d`

### Preservado

- `rpc_usuario_contexto_6c`
- `rpc_usuario_contexto_6a1`
- `rpc_perfis_disponiveis_6c`
- `rpc_listar_usuarios_perfis_6c`
- `rpc_salvar_usuario_perfil_6c`
- `rpc_alterar_status_usuario_perfil_6c`

### Validação

- Confirmado que RPCs 6E/6D bloqueadas ficaram `authenticated=false`, `anon=false` e `public=false`.
- Usuário testou o sistema após remoção da tela e confirmou funcionamento correto.
- Documentado em `docs/SEGURANCA_RPC_TESTE_PERFIS_20260612.md`.

---

## [1.1.21] - 2026-06-12

### Segurança

- Aplicada migration `security_revoke_diagnostic_documentation_rpcs_20260612`.
- Bloqueadas RPCs de diagnóstico/documentação que não fazem parte do uso operacional do sistema:
  - `rpc_diagnostico_leitura_perfil_6f`
  - `rpc_diagnostico_policies_antigas_6f`
  - `rpc_marco_fase_7a`
  - `rpc_revisao_final_producao_6g`
  - `rpc_registrar_versao_estavel_6g`

### Validação

- Confirmado que as RPCs ficaram `authenticated=false`, `anon=false` e `public=false`.
- Usuário testou carregamento e uso geral do sistema após o bloqueio e confirmou funcionamento correto.
- Documentado em `docs/SEGURANCA_RPC_DIAGNOSTICO_20260612.md`.

---

## [1.1.20] - 2026-06-12

### Segurança

- Bloqueada `rpc_relatorio_gerencial_5v` após migração do frontend para `rpc_relatorio_gerencial_7a5`.
- Aplicada migration `security_revoke_relatorio_gerencial_5v_20260612`.

### Alterado

- `clean/fechamento.js` passou a usar `rpc_relatorio_gerencial_7a5`.
- `clean/relatorios_pdf_js.js` também foi migrado para `rpc_relatorio_gerencial_7a5` por segurança, mesmo não sendo o caminho principal carregado no `index-clean.html`.

### Validação

- Confirmado que `rpc_relatorio_gerencial_5v` ficou `authenticated=false`, `anon=false` e `public=false`.
- Confirmado que `rpc_relatorio_gerencial_7a5` permaneceu `authenticated=true` e `anon=false`.
- Usuário testou Fechamento, PDF e Relatórios após a migração.

---

## [1.1.19] - 2026-06-12

### Alterado

- Fechamento e relatórios gerenciais migrados para a RPC oficial `rpc_relatorio_gerencial_7a5`.
- Atualizado cache-bust de `clean/fechamento.js` para `v=4`.
- Atualizado cache-bust de `clean/relatorios.js` para `v=8`.

### Validação

- Usuário testou:
  - Fechamento -> Gerar prévia
  - Fechamento -> Baixar PDF
  - Relatórios -> Gerar relatório
  - Relatórios -> Baixar PDF gerencial

---

## [1.1.18] - 2026-06-12

### Corrigido

- Restauradas permissões de execução para `authenticated` nas funções auxiliares `app_*` necessárias às RPCs operacionais.
- Correção aplicada após erro `permission denied for function app_has_permission`.

### Restaurado

- `app_perfil_usuario()`
- `app_has_permission(text)`
- `app_assert_permission(text)`
- `app_assert_can_operate_stock()`
- `app_is_admin()`
- `app_assert_admin()`
- `app_assert_active_profile()`

### Regra reforçada

- Não revogar `EXECUTE` de funções auxiliares `app_*` chamadas por RPCs operacionais sem antes refatorar arquitetura para schema privado.

---

## [1.1.17] - 2026-06-12

### Segurança

- Aplicada migration `security_revoke_legacy_generic_rpc_execute_20260612`.
- Bloqueada execução direta de RPCs legadas/genéricas sem fluxo operacional oficial.

### Bloqueado

- `rpc_baixar_equipamento(uuid,text)`
- `rpc_baixar_equipamento(uuid,text,uuid)`
- `rpc_movimentar_material(...)`

### Preservado

- `rpc_baixar_equipamento_controlado`
- `rpc_entrada_material`
- `rpc_saida_material_tecnico`
- `rpc_consumo_material_tecnico`

---

## [1.1.16] - 2026-06-12

### Segurança

- Aplicada migration `security_revoke_internal_app_trigger_execute_20260612`.
- Revogadas permissões diretas de algumas funções internas e triggers.
- Esta etapa revelou dependência operacional das funções auxiliares `app_*`.

### Observação

- A revogação de funções `app_*` foi agressiva demais e causou erro em RPCs operacionais.
- Correção registrada posteriormente na versão `1.1.18`.

---

## [1.1.15] - 2026-06-12

### Segurança

- Aplicada migration `security_fix_function_search_path_mutable_20260612`.
- Definido `search_path = public, pg_temp` em funções apontadas pelo Supabase Advisor.

### Ajustado

- `app_normalizar_bip_7a5(text)`
- `app_gerar_codigo_inventario_7a5()`
- `app_hash_termo_inventario_7a5_3(uuid)`
- `teste_gerar_codigo(text)`
- `teste_rpc_ping()`

---

## [1.1.14] - 2026-06-12

### Corrigido

- Corrigida a RPC oficial `rpc_materiais_painel_7a5` no Supabase de produção.
- Removida referência inválida à coluna `m.categoria` no KPI `materiais_cadastrados`.
- A tabela `modelos` não possui coluna `categoria`; a classificação correta é feita por `categoria_estoque` e `controle`.
- A aba Materiais deve voltar a carregar o painel, saldos e histórico recente pelo banco.

### Validação

- Confirmado no schema real que `modelos` possui `categoria_estoque`, mas não possui `categoria`.
- Confirmado que `materiais_saldos` e `materiais_movimentos` possuem coluna `categoria`, por isso a correção foi limitada apenas ao trecho que usa alias `m` da tabela `modelos`.
- Validada lógica equivalente do painel com retorno `ok=true`, `total_saldos=10`, `linhas_saldo=10`, `quantidade_total=2011`, `com_tecnicos=4` e `materiais_cadastrados=10`.
- Preservado `SECURITY DEFINER`, `search_path=public`, `authenticated_execute=true` e `anon_execute=false`.
- Nenhum arquivo JS/CSS foi alterado; portanto, não houve alteração de cache-bust no `index-clean.html`.

---

## [1.1.13] - 2026-06-12

### Segurança

- Aplicada migration `security_revoke_execute_trigger_functions_20260612` no Supabase de produção.
- Removida execução direta por `public`, `anon` e `authenticated` das funções de trigger:
  - `trg_fechamentos_sem_sobreposicao_5w2()`;
  - `trg_materiais_movimentos_periodo_aberto_5w2()`;
  - `trg_movimentos_periodo_aberto_5w2()`;
  - `trg_user_profiles_updated_at_6c()`.
- Corrigido o bloco de alertas `anon_security_definer_function_executable` relacionado a essas quatro triggers.

### Validação

- Teste manual prévio com `begin -> revoke -> select privileges -> rollback` retornou `false` para `public`, `anon` e `authenticated` nas quatro funções.
- Após aplicação definitiva, nova validação confirmou `public_execute=false`, `anon_execute=false` e `authenticated_execute=false`.
- Triggers permaneceram `enabled` nas tabelas oficiais.
- Nenhum arquivo JS/CSS foi alterado; portanto, não houve alteração de cache-bust no `index-clean.html`.

### Observação operacional

- Durante a janela de validação houve uso real do sistema: `movimentos` aumentou de 177 para 178 e `audit_log` registrou nova saída rápida em lote. A migration aplicada contém apenas `REVOKE EXECUTE` e não grava movimentação de estoque.

---

## [1.1.1] - 2026-06-09

### Alterado

- Incorporada a desativação de modelo, técnico e local diretamente no módulo oficial `clean/main.js`.
- O fluxo de desativação agora usa card interno com motivo obrigatório, sem caixa nativa do navegador.
- Atualizado cache do `index-clean.html` para carregar `clean/main.js?v=7` e `clean/version.js?v=2`.

### Removido

- Removido definitivamente o carregamento de `clean/desativar-modelo-fix.js`.
- Removido o arquivo `clean/desativar-modelo-fix.js` do repositório.
- Removido uso de caixa nativa para desativação em cadastros.

### Segurança operacional

- Desativação agora exige motivo com no mínimo 6 caracteres.
- Histórico continua preservado via RPC oficial.
- Fluxo de cadastro deixa de depender de arquivo de contorno.

---

## [1.1.0] - 2026-06-09

### Adicionado

- Criado controle formal de versão do sistema por `version.json`.
- Criado changelog oficial do projeto.
- Criada documentação de processo de versionamento.
- Criado módulo visual de versão para exibição dentro do app.

### Alterado

- Reestruturado fisicamente o módulo `clean/entrada.js`.
- Reestruturado fisicamente o módulo `clean/entrada_lote.js`.
- Atualizado cache do `index-clean.html` para carregar `entrada.js?v=5` e `entrada_lote.js?v=5`.
- Entrada individual agora usa conferência em tela antes de gravar.
- Entrada em lote agora usa fluxo nativo MAC -> Serial/SN -> pré-entrada automática -> volta para MAC.
- Comprovantes e tabelas passaram a exibir MAC e Serial/SN separadamente.

### Removido

- Removido carregamento externo de patches de entrada pelo `desativar-modelo-fix.js`.
- Removido arquivo externo `clean/entrada_fluxo_seguro.js`.
- Removido arquivo externo `clean/entrada_normal_confirmacao.js`.

### Segurança operacional

- Reduzido risco de cadastro acidental sem conferência.
- Reduzido risco de serial não visualizado por estar misturado com MAC.
- Mantido uso das RPCs existentes sem alteração no banco nesta versão.

---

## [1.0.0] - Base inicial

### Base

- Sistema LIKE Estoque em GitHub Pages + Supabase.
- Controle de equipamentos patrimoniais.
- Entrada individual.
- Entrada em lote.
- Saída de equipamentos.
- Devolução.
- Manutenção.
- Baixa controlada.
- Materiais.
- Técnicos.
- Auditoria.
- Fechamento operacional.
- Inventário por bipagem.
- Backup operacional.
- Permissões e usuários.
