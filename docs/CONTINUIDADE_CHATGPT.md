# Continuidade do ChatGPT - LIKE Estoque

Este arquivo existe para impedir perda de contexto quando um chat travar, ficar grande demais ou precisar ser continuado em outro atendimento.

A regra é simples: antes de qualquer alteração no projeto, o novo chat deve ler este arquivo e o arquivo `docs/ai-state.json`.

---

## 1. Como retomar em outro chat

Cole esta mensagem no novo chat:

```text
Você vai continuar o projeto LIKE Estoque.
Antes de responder, leia no GitHub o repositório DanielCavalcante124/like-estoque e use como fonte de verdade estes arquivos:

1. docs/CONTINUIDADE_CHATGPT.md
2. docs/ai-state.json
3. version.json
4. docs/VERSIONAMENTO.md
5. docs/AMBIENTES_FREE.md
6. docs/AMBIENTE_LOCAL_SUPABASE.md, se o assunto for ambiente local

Aja como desenvolvedor full stack sênior. Não faça gambiarra. Não use patch paralelo quando a correção deve ser física no arquivo oficial. Não use prompt()/confirm() do navegador. Não altere banco de produção sem explicar risco, criar migration segura e validar. Preserve histórico, segurança, RLS e integridade do estoque.

Me diga primeiro o estado atual do projeto e depois continue exatamente do ponto onde paramos.
```

---

## 2. Perfil do dono do projeto

- Nome conhecido no projeto: Daniel Cavalcante.
- Idioma: português do Brasil.
- Estilo desejado: direto, técnico, objetivo, sem enrolação.
- O usuário está aprendendo banco de dados, Supabase e GitHub, então precisa de passo a passo claro quando for algo operacional.
- O usuário não quer respostas genéricas nem concordância automática com decisões ruins.
- O usuário quer solução de produção, com visual profissional, segurança e mínimo risco de falha.
- O usuário aceita correção técnica firme quando a ideia dele gerar risco.
- O usuário prefere GitHub Pages + Supabase no plano gratuito, desde que a arquitetura seja segura.

---

## 3. Regra máxima de segurança operacional

Para qualquer alteração crítica em produção, o padrão oficial agora é:

```text
snapshot antes -> begin -> teste controlado -> rollback -> snapshot depois -> comparação -> aplicar só se seguro
```

Essa regra nasceu após a ideia do usuário de testar com rollback e validar se nenhuma informação oficial foi alterada.

### 3.1 Tabelas oficiais mínimas para snapshot

```sql
select jsonb_build_object(
  'equipamentos', (select count(*) from public.equipamentos),
  'movimentos', (select count(*) from public.movimentos),
  'materiais_movimentos', (select count(*) from public.materiais_movimentos),
  'materiais_saldos', (select count(*) from public.materiais_saldos),
  'tecnicos', (select count(*) from public.tecnicos),
  'modelos', (select count(*) from public.modelos),
  'locais', (select count(*) from public.locais),
  'audit_log', (select count(*) from public.audit_log)
) as snapshot;
```

### 3.2 Modelo seguro de teste SQL

```sql
begin;

-- executar teste controlado aqui
-- nunca usar teste com dados reais sem saber exatamente o impacto

rollback;
```

### 3.3 Regra de aplicação real

Só aplicar mudança real quando:

- a função/migration foi revisada;
- não há dependência quebrada no GitHub;
- não há dependência quebrada em funções oficiais do banco;
- o teste transacional foi possível;
- snapshot antes/depois confirmou que nenhuma tabela oficial mudou;
- o usuário entendeu o risco quando envolver produção.

### 3.4 Limite dessa regra

O rollback é excelente para testar DML/execução de RPCs pelo SQL, mas não substitui teste visual do navegador.

Ainda precisam de teste manual do usuário:

- login real;
- clique real em botões;
- download/visualização de PDF;
- copiar WhatsApp;
- comportamento visual de modal/card;
- erros de DOM/console no navegador.

---

## 4. Regras rígidas do projeto

### 4.1 Código e arquitetura

- Não criar gambiarra.
- Não criar patch paralelo quando o correto for alterar o arquivo oficial.
- Não criar loader escondido para sobrescrever comportamento.
- Evitar arquivos temporários que fiquem mascarando erro real.
- Preferir alteração física e clara nos módulos oficiais.
- Separar front, API, banco, regras e documentação.
- Sempre preservar histórico de movimentações.
- Evitar duplicidade de função no banco sem motivo técnico claro.
- Se existir arquivo oficial, alterar o oficial, não criar `novo_final_corrigido`.

### 4.2 UX e interface

- Não usar `prompt()` ou `confirm()` do navegador.
- Confirmações devem ser feitas em card/modal interno do sistema.
- Mensagens de erro precisam ser claras.
- Botões devem ficar onde fazem sentido no fluxo operacional.
- Evitar botão perdido em categoria errada do menu.
- Operações perigosas precisam mostrar resumo antes de confirmar.

### 4.3 Banco de dados

- Não apagar histórico.
- Não deletar equipamento para corrigir status.
- Usar migrations para DDL.
- Usar RPC quando a operação altera estado crítico.
- Usar `SELECT` para validação sem alterar dados.
- Não executar `UPDATE`, `INSERT`, `DELETE` em produção sem autorização clara.
- Sempre pensar em `ativo`, status, técnico atual, cliente atual, OS e movimentos.
- Antes de recriar RPC que junta tabelas diferentes, consultar `information_schema.columns` e confirmar nomes reais das colunas.
- Nunca confiar em memória sobre coluna; consultar schema.

### 4.4 Segurança

- Nunca expor `service_role` no front-end.
- Usar chave pública/publishable/anon no navegador.
- RPCs críticas devem ser executáveis apenas por usuário autenticado.
- Verificar Supabase Advisors após migrations sensíveis.
- Ambiente de teste não deve gravar nas tabelas reais.
- Funções `SECURITY DEFINER` devem ter `set search_path` fixo.
- Funções/tabelas de teste não devem ficar acessíveis em produção.
- Objetos `teste_*` devem ficar bloqueados ou apagados após validação.
- Preferir `revoke execute from anon` para funções que não são públicas.

---

## 5. Repositório, ambiente e fonte da verdade

- Repositório: `DanielCavalcante124/like-estoque`
- Supabase project_id: `yuyeyawigbbjtzghkbbr`
- Organização Supabase conhecida: `ytjjsbojtngmaflgdocv`
- Plano Supabase: Free.
- Hospedagem: GitHub Pages + Supabase.
- Front principal: `index-clean.html`
- Redirecionamento antigo: `index.html` aponta para versão limpa.

Arquivos principais:

```text
index-clean.html
clean/api.js
clean/env.js
clean/main.js
clean/version.js
clean/entrada.js
clean/entrada_lote.js
clean/saida_equipamento.js
clean/operacao_rapida.js
clean/lotes_saida.js
clean/devolucao_equipamento.js
clean/manutencao_equipamento.js
clean/baixa_equipamento.js
clean/historico_equipamento.js
clean/equipamentos.js
clean/tecnicos.js
clean/materiais.js
clean/relatorios.js
clean/auditoria.js
clean/dashboard.js
clean/permissoes.js
clean/menu_operacao_fix.js
version.json
CHANGELOG.md
docs/VERSIONAMENTO.md
docs/CONTINUIDADE_CHATGPT.md
docs/ai-state.json
```

---

## 6. Cache-bust atual importante

Sempre que alterar JS carregado pelo HTML, atualizar o `?v=` no `index-clean.html`.

Estado conhecido após as otimizações recentes:

```html
<script type="module" src="clean/main.js?v=7"></script>
<script src="clean/login.js?v=3"></script>
<script type="module" src="clean/operacao_rapida.js?v=5"></script>
<script type="module" src="clean/lotes_saida.js?v=1"></script>
<script type="module" src="clean/dashboard.js?v=3"></script>
<script type="module" src="clean/entrada.js?v=5"></script>
<script type="module" src="clean/entrada_lote.js?v=5"></script>
<script type="module" src="clean/retorno_sem_cadastro.js?v=3"></script>
<script type="module" src="clean/saida_equipamento.js?v=5"></script>
<script type="module" src="clean/confirmar_instalacao.js?v=2"></script>
<script type="module" src="clean/devolucao_equipamento.js?v=4"></script>
<script type="module" src="clean/manutencao_equipamento.js?v=2"></script>
<script type="module" src="clean/baixa_equipamento.js?v=3"></script>
<script type="module" src="clean/historico_equipamento.js?v=3"></script>
<script type="module" src="clean/equipamentos.js?v=6"></script>
<script type="module" src="clean/materiais.js?v=2"></script>
<script type="module" src="clean/tecnicos.js?v=4"></script>
<script type="module" src="clean/relatorios.js?v=8"></script>
<script type="module" src="clean/auditoria.js?v=2"></script>
<script type="module" src="clean/fechamento.js?v=3"></script>
<script type="module" src="clean/impacto_fechamento.js?v=1"></script>
<script type="module" src="clean/analise_operacional.js?v=1"></script>
<script type="module" src="clean/producao.js?v=2"></script>
<script type="module" src="clean/backup.js?v=1"></script>
<script type="module" src="clean/usuarios.js?v=1"></script>
<script type="module" src="clean/backlog.js?v=2"></script>
<script type="module" src="clean/inventario_bip.js?v=7"></script>
<script type="module" src="clean/inventario_materiais.js?v=1"></script>
<script type="module" src="clean/inventario_relatorio.js?v=2"></script>
<script type="module" src="clean/inventario_termo.js?v=1"></script>
<script type="module" src="clean/permissoes.js?v=5"></script>
<script type="module" src="clean/teste_perfis.js?v=1"></script>
<script src="clean/menu_operacao_fix.js?v=1"></script>
<script src="clean/version.js?v=7"></script>
```

Regra: depois de alteração no front, orientar o usuário a fazer `Ctrl + F5`.

---

## 7. Estado do banco em snapshot recente

Snapshot validado no dia 2026-06-11 após teste de rollback:

```text
equipamentos: 161
movimentos: 175
materiais_movimentos: 14
materiais_saldos: 8
tecnicos: 11
modelos: 31
locais: 8
audit_log: 219
```

O teste de rollback confirmou:

```text
sem_alteracao = true
```

Esses números não devem ser tratados como fixos eternamente; servem como referência daquele momento.

---

## 8. Estado funcional por módulo

### 8.1 Entrada normal

Arquivo: `clean/entrada.js`

- Entrada com MAC e Serial/SN separados.
- Enter no MAC foca Serial/SN.
- Enter no Serial/SN solicita envio.
- Usa confirmação interna, não `prompt()`/`confirm()`.
- Usa RPC `rpc_registrar_entrada_equipamento`.
- Deve manter validação de duplicidade.

### 8.2 Entrada em lote

Arquivo: `clean/entrada_lote.js`

- Pré-cadastro de itens em lote.
- Valida duplicidade local e no sistema.
- Usa confirmação interna.
- Usa RPC `rpc_registrar_entrada_equipamento_lote`.
- Não deve criar equipamentos parcialmente sem controle transacional.

### 8.3 Equipamentos

Arquivo: `clean/equipamentos.js`

- Otimizado com `rpc_pesquisar_equipamentos_7a5`.
- Paginação de 50 por página.
- Debounce aproximado de 350 ms.
- Produção conhecida: `clean/equipamentos.js?v=6`.
- Não deve voltar a usar `table('equipamentos')` para listagem geral.

RPC central:

```text
rpc_pesquisar_equipamentos_7a5
```

Filtros conhecidos:

```text
ativos
todos
estoque
tecnico
cliente
manutencao
garantia
aguardando_baixa
baixados
retorno_sem_cadastro
devolucao
baixa
```

### 8.4 Saída normal

Arquivo: `clean/saida_equipamento.js`

- Usa `rpc_pesquisar_equipamentos_7a5` com filtro de estoque.
- Produção conhecida: `clean/saida_equipamento.js?v=5`.
- Não deve carregar equipamentos inteiros no front.

### 8.5 Operação rápida / saída em lote

Arquivo: `clean/operacao_rapida.js`

- Otimizada com `rpc_operacao_rapida_busca_7a5`.
- Produção conhecida: `clean/operacao_rapida.js?v=5`.
- Busca no banco sob demanda.
- Retorno limitado: 15 equipamentos e 15 materiais.
- Confirmação segue usando `rpc_operacao_rapida_saida_lote`.

Erro que não deve voltar:

```js
table('equipamentos')
table('materiais_saldos')
table('tecnicos')
```

Isso era perigoso para crescimento.

### 8.6 Lotes de saída

Arquivo: `clean/lotes_saida.js`

- Usa `rpc_historico_lotes_saida`.
- Tem limite de busca: 25, 50, 100, 200.
- Está no caminho certo, porque consulta histórico limitado no banco.

### 8.7 Retorno sem cadastro

Arquivo: `clean/retorno_sem_cadastro.js`

- Otimizado com RPC central de equipamentos.
- Produção conhecida: `clean/retorno_sem_cadastro.js?v=3`.

### 8.8 Devolução

Arquivo: `clean/devolucao_equipamento.js`

- Usa `rpc_pesquisar_equipamentos_7a5` com filtro de devolução.
- Produção conhecida: `clean/devolucao_equipamento.js?v=4`.

### 8.9 Manutenção

Arquivo: `clean/manutencao_equipamento.js`

- Usa `rpc_pesquisar_equipamentos_7a5` com filtro de manutenção.
- Produção conhecida: `clean/manutencao_equipamento.js?v=2`.
- Arquivo auxiliar antigo `clean/manutencao_performance.js` foi removido.
- Exporta seleção assíncrona para integração:

```js
window.manutencaoCleanLoad
window.manutencaoCleanSelectById
```

### 8.10 Baixa

Arquivo: `clean/baixa_equipamento.js`

- Usa `rpc_pesquisar_equipamentos_7a5` com filtro de baixa.
- Produção conhecida: `clean/baixa_equipamento.js?v=3`.
- Exporta seleção assíncrona:

```js
window.baixaCleanLoad
window.baixaCleanSelectById
```

### 8.11 Histórico

Arquivo: `clean/historico_equipamento.js`

- Usa `rpc_pesquisar_equipamentos_7a5` com filtro `todos`.
- Produção conhecida: `clean/historico_equipamento.js?v=3`.
- Exporta seleção assíncrona:

```js
window.historicoCleanLoad
window.historicoCleanSelectById
```

Atenção: seleção por UUID precisa continuar funcionando. Se falhar, criar ou ajustar RPC específica por ID.

### 8.12 Técnicos

Arquivo: `clean/tecnicos.js`

- Migrado para RPCs:
  - `rpc_tecnicos_resumo_7a5`
  - `rpc_tecnico_detalhe_7a5`
- Produção conhecida: `clean/tecnicos.js?v=4`.
- Não deve carregar diretamente:
  - `equipamentos` inteiro;
  - `movimentos` inteiro;
  - `materiais_saldos` inteiro;
  - `materiais_movimentos` inteiro.

Botões existentes:

```text
Copiar cobrança WhatsApp
Copiar resumo
```

Erro corrigido:

```text
column "data" does not exist
```

Causa:

- `materiais_movimentos` não tem coluna `data`.
- Correção: usar `created_at as data` na RPC.

### 8.13 Materiais

Arquivo: `clean/materiais.js`

- Migrado para RPC `rpc_materiais_painel_7a5`.
- Produção conhecida: `clean/materiais.js?v=2`.
- Não deve carregar todo o histórico `materiais_movimentos` no front.
- Painel recebe saldos, movimentos recentes, KPIs e limites.

### 8.14 Relatórios gerenciais

Arquivo: `clean/relatorios.js`

- Migrado para RPC `rpc_relatorio_gerencial_7a5`.
- Produção conhecida: `clean/relatorios.js?v=8`.
- KPIs calculados no banco.
- Listas operacionais limitadas no banco.
- PDF/CSV usam lista carregada, sem puxar histórico gigante.

### 8.15 Dashboard e Auditoria

Arquivos:

```text
clean/dashboard.js
clean/auditoria.js
```

Dashboard usa RPC agregada, mas ainda há atenção com auditoria:

- `rpc_auditoria_divergencias_5v1` é pesada.
- Pode varrer várias tabelas e gerar muitas divergências.
- Ainda é pendência futura separar resumo e lista paginada.

Melhor arquitetura futura:

```text
rpc_auditoria_resumo_7a5
rpc_auditoria_divergencias_7a5(p_limit, p_offset, filtros)
```

### 8.16 Produção

Arquivo: `clean/producao.js`

- Área técnica/admin de healthcheck.
- Usa `rpc_usuario_contexto_6a1` e `rpc_healthcheck_producao_6a`.
- Não é gargalo operacional diário.
- Deve ser usado para alertas, mas não substitui Supabase Advisors.

---

## 9. RPCs importantes conhecidas

### Busca e consulta

```text
rpc_pesquisar_equipamentos_7a5
rpc_operacao_rapida_busca_7a5
rpc_tecnicos_resumo_7a5
rpc_tecnico_detalhe_7a5
rpc_materiais_painel_7a5
rpc_relatorio_gerencial_7a5
rpc_historico_lotes_saida
```

### Operações críticas de equipamento

```text
rpc_registrar_entrada_equipamento
rpc_registrar_entrada_equipamento_lote
rpc_registrar_saida_equipamento
rpc_operacao_rapida_saida_lote
rpc_registrar_devolucao_equipamento
rpc_registrar_manutencao_equipamento
rpc_baixar_equipamento_controlado
rpc_confirmar_instalacao_cliente
```

### Operações críticas de material

```text
rpc_entrada_material
rpc_saida_material_tecnico
rpc_consumo_material_tecnico
rpc_movimentar_material
```

### Permissão esperada

Para RPC oficial operacional:

```text
authenticated_execute = true
anon_execute = false
```

Para RPC de teste bloqueada:

```text
authenticated_execute = false
anon_execute = false
```

---

## 10. Quarentena de objetos de teste

### 10.1 Objetos bloqueados

Funções de teste bloqueadas:

```text
teste_gerar_codigo
teste_rpc_baixar_equipamento_controlado
teste_rpc_confirmar_instalacao_cliente
teste_rpc_ping
teste_rpc_registrar_devolucao_equipamento
teste_rpc_registrar_entrada_equipamento
teste_rpc_registrar_entrada_equipamento_lote
teste_rpc_registrar_manutencao_equipamento
teste_rpc_registrar_saida_equipamento
```

Resultado esperado:

```text
public_execute = false
anon_execute = false
authenticated_execute = false
```

Tabelas de teste:

```text
teste_equipamentos
teste_movimentos
```

Estado esperado após quarentena:

- sem grants para `public`, `anon`, `authenticated`;
- RLS ativado;
- sem policies permissivas.

### 10.2 Importante

Não apagar definitivamente ainda sem o usuário testar a produção pelo navegador.

Depois dos testes manuais, se tudo funcionar, pode apagar:

```sql
drop function if exists public.teste_rpc_ping() cascade;
-- e demais teste_*, revisando assinatura real antes
```

E para tabelas:

```sql
drop table if exists public.teste_equipamentos cascade;
drop table if exists public.teste_movimentos cascade;
```

Mas só fazer isso depois de validar produção e, de preferência, com backup/snapshot.

---

## 11. Erros e aprendizados importantes

### 11.1 Erro: `column "data" does not exist`

Contexto:

- Aba Técnicos não carregava.
- Erro informado pelo usuário: `column "data" does not exist`.

Causa:

- RPC `rpc_tecnico_detalhe_7a5` buscava `data` em `materiais_movimentos`.
- Tabela `materiais_movimentos` só tem `created_at`.

Correção:

```sql
created_at as data
```

na parte de histórico de materiais.

Aprendizado:

Antes de criar/recriar RPC com tabelas parecidas, consultar:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('movimentos', 'materiais_movimentos')
order by table_name, column_name;
```

### 11.2 Erro de processo: arquivo de documentação errado

O assistente criou por engano:

```text
docs/ACERTOS_E_ERROS.md
```

O arquivo correto é:

```text
docs/CONTINUIDADE_CHATGPT.md
```

A tentativa de apagar o arquivo errado pela ferramenta foi bloqueada. O usuário deve remover manualmente pelo GitHub se quiser limpar duplicidade:

```text
GitHub -> docs -> ACERTOS_E_ERROS.md -> Delete file -> Commit changes
```

Regra aprendida:

Antes de criar documentação nova, procurar primeiro pelo nome correto informado pelo usuário.

### 11.3 Erro evitado: mexer na RPC de gravação quando o problema era busca

Na Operação Rápida, o problema era carregamento/busca. A confirmação da saída em lote já estava centralizada em RPC crítica.

Decisão correta:

- Criar RPC de busca.
- Não mexer na RPC de confirmação.

---

## 12. Testes feitos pelo assistente

O assistente conseguiu testar:

- Funções `teste_*` bloqueadas.
- Tabelas `teste_*` sem grants para `public`, `anon`, `authenticated`.
- Policies de tabelas `teste_*` removidas.
- RPCs oficiais principais continuam existindo.
- RPCs oficiais estão liberadas para `authenticated` e bloqueadas para `anon`.
- Código GitHub não usa `teste_rpc_`, `teste_equipamentos` ou `teste_movimentos`.
- Funções oficiais não referenciam `teste_rpc_`, `teste_equipamentos` ou `teste_movimentos`.
- Rollback com snapshot antes/depois não alterou tabelas oficiais.

O assistente não conseguiu testar sozinho:

- Navegação real do usuário no site.
- Login real pela interface.
- PDF baixado/aberto.
- Copiar WhatsApp.
- Clique visual nos botões.
- Erros de console do navegador.

---

## 13. Testes manuais recomendados ao usuário

Ordem mínima após qualquer mudança crítica:

```text
1. Login
2. Dashboard
3. Técnicos
4. Operação rápida
5. Entrada normal
6. Entrada em lote
7. Saída normal
8. Saída em lote
9. Lotes de saída
10. Devolução
11. Manutenção
12. Baixa
13. Materiais
14. Histórico
15. Relatórios
16. Inventário
17. Produção
```

Se falhar, pedir ao usuário:

```text
Tela:
Ação:
Erro exato:
Print:
Console, se tiver:
```

---

## 14. Pendências técnicas conhecidas

### Segurança

- Corrigir funções com `function_search_path_mutable` apontadas pelo Supabase Advisor.
- Revisar triggers `SECURITY DEFINER` executáveis por `anon` apontados pelo Advisor:
  - triggers de fechamento;
  - triggers de materiais;
  - triggers de movimentos;
  - trigger de user_profiles.
- Revisar funções internas `app_assert_*` executáveis por authenticated, avaliando se devem ser callable diretamente ou apenas internamente.
- Depois dos testes manuais, apagar definitivamente objetos `teste_*` se nada quebrar.

### Performance

- Criar índices nas FKs sem cobertura apontadas pelo Advisor.
- Corrigir RLS policies que reavaliam `auth.uid()` por linha usando `(select auth.uid())`.
- Revisar Auditoria/Dashboard se ficarem pesados.
- Evitar retorno ilimitado em qualquer nova RPC.

### Arquitetura

- Incorporar `Confirmar instalação` diretamente em `clean/permissoes.js`, removendo `menu_operacao_fix.js`.
- Atualizar textos antigos do `index-clean.html` que ainda mencionam patches antigos.
- Padronizar imports para versão mais recente de `api.js` e `env.js`.
- Manter `docs/ai-state.json` sincronizado com este documento.

---

## 15. Checklist antes de qualquer mudança

```text
1. Entender a regra de negócio.
2. Verificar se já existe função parecida.
3. Preferir arquivo oficial em vez de patch.
4. Verificar colunas reais no Supabase com SELECT.
5. Evitar escrita no banco durante validação.
6. Se alterar banco, usar migration.
7. Se alterar front, atualizar cache-bust.
8. Testar sem quebrar fluxo existente.
9. Informar exatamente o que mudou.
10. Registrar no versionamento quando fizer sentido.
11. Para operação crítica, testar com begin/rollback e snapshot antes/depois.
12. Se a ferramenta bloquear algo, explicar o bloqueio e passar o passo manual.
```

---

## 16. Comandos úteis de validação

### Verificar funções de teste expostas

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  has_function_privilege('public', p.oid, 'EXECUTE') as public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    p.proname ilike 'teste\_%' escape '\'
    or p.proname ilike 'test\_%' escape '\'
  )
order by p.proname;
```

### Verificar grants em tabelas de teste

```sql
select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and (
    table_name ilike 'teste\_%' escape '\'
    or table_name ilike 'test\_%' escape '\'
  )
  and grantee in ('public', 'anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

### Verificar dependência de funções oficiais em objetos de teste

```sql
with funcs as (
  select p.proname, pg_get_functiondef(p.oid) as definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)
select proname
from funcs
where proname not ilike 'teste\_%' escape '\'
  and proname not ilike 'test\_%' escape '\'
  and (
    definition ilike '%teste_rpc_%'
    or definition ilike '%teste_equipamentos%'
    or definition ilike '%teste_movimentos%'
  )
order by proname;
```

### Verificar RPCs oficiais operacionais

```sql
select
  proname,
  count(*) as overloads,
  bool_or(has_function_privilege('authenticated', p.oid, 'EXECUTE')) as authenticated_can_execute,
  bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')) as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
and proname in (
  'rpc_baixar_equipamento_controlado',
  'rpc_consumo_material_tecnico',
  'rpc_entrada_material',
  'rpc_materiais_painel_7a5',
  'rpc_operacao_rapida_busca_7a5',
  'rpc_operacao_rapida_saida_lote',
  'rpc_pesquisar_equipamentos_7a5',
  'rpc_registrar_devolucao_equipamento',
  'rpc_registrar_entrada_equipamento',
  'rpc_registrar_entrada_equipamento_lote',
  'rpc_registrar_manutencao_equipamento',
  'rpc_relatorio_gerencial_7a5',
  'rpc_saida_material_tecnico',
  'rpc_tecnico_detalhe_7a5',
  'rpc_tecnicos_resumo_7a5'
)
group by proname
order by proname;
```

---

## 17. Regra para próximos chats

Se o próximo chat esquecer o contexto, ele deve:

1. Ler este arquivo.
2. Ler `docs/ai-state.json`.
3. Verificar `index-clean.html` para cache atual.
4. Nunca assumir que sabe o schema: consultar Supabase.
5. Não apagar nada sem busca de dependência.
6. Usar rollback/snapshot em teste crítico.
7. Atualizar este arquivo quando houver erro, acerto importante ou decisão arquitetural.
