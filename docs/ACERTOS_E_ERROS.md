# Acertos, erros e regras do projeto LIKE Estoque

Este documento registra aprendizados práticos do projeto, principalmente decisões que não devem ser esquecidas em próximas alterações.

## Regra principal para mudanças críticas em produção

Antes de aplicar alteração crítica no banco de produção, seguir este fluxo obrigatório:

1. Tirar snapshot antes das tabelas oficiais.
2. Executar teste controlado dentro de transação.
3. Usar `rollback` no fim do teste.
4. Tirar snapshot depois.
5. Comparar se nenhuma tabela oficial mudou.
6. Só aplicar alteração real se o teste passar.

Tabelas oficiais mínimas para snapshot:

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

Modelo seguro de teste:

```sql
begin;

-- executar teste controlado aqui

rollback;
```

Nunca testar operação destrutiva diretamente sem rollback, salvo quando a intenção for aplicar a mudança definitiva.

## Acertos confirmados

### 2026-06-11 — Quarentena segura dos objetos de teste

Foram bloqueadas as funções e tabelas de teste sem apagar imediatamente.

Ações corretas:

- Revogar execução de funções `teste_*` para `public`, `anon` e `authenticated`.
- Revogar acesso de tabelas `teste_*` para `public`, `anon` e `authenticated`.
- Habilitar RLS nas tabelas de teste.
- Remover policies permissivas das tabelas de teste.
- Não apagar ainda sem validação manual de produção.

Validações feitas:

- `teste_rpc_*` não apareceu no código do GitHub.
- `teste_equipamentos` não apareceu no código do GitHub.
- `teste_movimentos` não apareceu no código do GitHub.
- Funções oficiais do banco não referenciam `teste_rpc_`, `teste_equipamentos` ou `teste_movimentos`.
- As funções oficiais críticas continuaram existindo e liberadas para `authenticated`.

Resultado esperado após quarentena:

```text
anon_execute = false
authenticated_execute = false
```

### 2026-06-11 — Operação Rápida otimizada

Erro evitado: carregar a tabela inteira de equipamentos no navegador.

Antes, a Operação Rápida carregava tabelas completas:

```js
table('equipamentos')
table('materiais_saldos')
table('tecnicos')
```

Correção aplicada:

- Criada RPC `rpc_operacao_rapida_busca_7a5`.
- Busca passou a ser sob demanda no banco.
- Limite de retorno: 15 equipamentos e 15 materiais.
- Confirmação da saída em lote continuou usando `rpc_operacao_rapida_saida_lote`.
- Cache atualizado em `index-clean.html` para `clean/operacao_rapida.js?v=5`.

Decisão correta:

- Não mexer na RPC de confirmação se o problema for apenas busca/carregamento.
- A gravação crítica deve continuar centralizada no banco.

### 2026-06-11 — Técnicos otimizado

A aba Técnicos foi migrada para RPCs:

- `rpc_tecnicos_resumo_7a5`
- `rpc_tecnico_detalhe_7a5`

Objetivo:

- Evitar carregar `equipamentos`, `movimentos`, `materiais_saldos` e `materiais_movimentos` inteiros no front.

Decisão correta:

- Resumo e detalhe do técnico devem ser calculados no banco.
- A tela deve consumir JSON limitado, não tabelas inteiras.

### 2026-06-11 — Relatórios gerenciais otimizados

Criada RPC limitada:

- `rpc_relatorio_gerencial_7a5`

Acerto:

- KPIs calculados no banco.
- Listas operacionais limitadas no banco.
- PDF/CSV usam a lista carregada, sem puxar histórico gigante.

### 2026-06-11 — Materiais otimizados

Criada RPC:

- `rpc_materiais_painel_7a5`

Acerto:

- Materiais não devem carregar todo o histórico `materiais_movimentos` no front.
- Painel deve receber saldos, movimentos recentes, KPIs e limites.

## Erros encontrados e corrigidos

### 2026-06-11 — Erro `column "data" does not exist` na aba Técnicos

Erro cometido:

Na RPC `rpc_tecnico_detalhe_7a5`, foi usada a coluna `data` na tabela `materiais_movimentos`.

Problema:

- `movimentos` tem `data` e `created_at`.
- `materiais_movimentos` tem `created_at`, mas não tem `data`.

Correção aplicada:

```sql
created_at as data
```

na parte de histórico de materiais.

Regra aprendida:

Antes de recriar RPC que junta tabelas diferentes, consultar `information_schema.columns` e confirmar nomes de colunas reais.

Consulta recomendada:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('movimentos', 'materiais_movimentos')
order by table_name, column_name;
```

### 2026-06-11 — Limite do teste automatizado pelo assistente

O assistente consegue testar com segurança:

- Catálogo do banco.
- Permissões de funções.
- Grants e policies.
- Existência de RPCs oficiais.
- Definição de funções.
- Snapshots antes/depois.
- Testes transacionais com rollback.

O assistente não consegue testar sozinho:

- Clique real no navegador.
- Login real pela interface.
- PDF visual baixado.
- Copiar WhatsApp no navegador.
- Fluxos visuais que dependem de DOM/interação real do usuário.

Regra aprendida:

Quando o teste depender de navegador real, o usuário deve testar manualmente e enviar tela/erro exato.

## Regras permanentes de desenvolvimento

1. Nunca carregar tabelas grandes inteiras no front.
2. Usar RPC com limite, offset e filtro para telas operacionais.
3. Atualizar cache no `index-clean.html` sempre que arquivo JS mudar.
4. Nunca expor `service_role` no front.
5. Função `SECURITY DEFINER` deve ter `set search_path` fixo.
6. Funções críticas devem negar `anon`.
7. Tabelas de teste não devem ficar acessíveis em produção.
8. Antes de apagar objeto, verificar dependência no GitHub e no banco.
9. Para alterações críticas, usar transação com rollback e snapshot antes/depois.
10. Se uma correção for só de busca/performance, não mexer na RPC de gravação crítica.

## Pendências técnicas conhecidas

- Revisar funções com `function_search_path_mutable` apontadas pelo Supabase Advisor.
- Revisar triggers `SECURITY DEFINER` executáveis por `anon` apontados pelo Advisor.
- Depois dos testes manuais, apagar definitivamente objetos `teste_*` se nada quebrar.
- Revisar índices de FKs sem cobertura apontados pelo Advisor.
- Revisar Auditoria/Dashboard se ficarem pesados em produção.
