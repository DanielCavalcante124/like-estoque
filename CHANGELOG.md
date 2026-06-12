# CHANGELOG - LIKE Estoque

Todas as alterações relevantes do sistema devem ser registradas neste arquivo.

Formato adotado: versionamento semântico.

- `MAJOR`: mudança grande, quebra de compatibilidade ou reestruturação crítica.
- `MINOR`: nova funcionalidade ou reestruturação sem quebrar uso normal.
- `PATCH`: correção pequena, ajuste visual ou melhoria pontual.

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