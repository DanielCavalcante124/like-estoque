# Abertura 7A - Melhorias pós-versão estável

Data: 2026-06-08

## Objetivo

Abrir a fase 7A como ciclo de evolução após a versão estável 6G.

A regra principal:

- 6G permanece como base estável de produção
- 7A em diante concentra melhorias novas
- novas funcionalidades não devem ser misturadas com estabilização da 6G

## Backend criado

Migration aplicada:

- abrir_fase_7a_backlog_melhorias

Criado:

- public.backlog_melhorias_7a
- public.rpc_criar_item_backlog_7a
- public.rpc_listar_backlog_7a
- public.rpc_marco_fase_7a

## Segurança

Tabela backlog_melhorias_7a:

- RLS ativo
- leitura permitida para perfis com relatórios/produção
- insert direto bloqueado
- update direto bloqueado
- criação/atualização apenas por RPC admin

## Backlog inicial registrado

### 7A.1 - Painel de backlog/melhorias no frontend

Prioridade:

- média

Impacto:

- organiza a evolução pós-estável

Risco:

- baixo, não altera fluxo operacional existente

### 7A.2 - Melhorar UX mobile dos fluxos mais usados

Prioridade:

- alta

Impacto:

- melhora uso em campo e reduz erro operacional

Risco:

- médio, exige teste em telas críticas

### 7A.3 - Exportação gerencial XLS/CSV além de PDF

Prioridade:

- média

Impacto:

- facilita análise externa e envio para gestão

Risco:

- baixo a médio, cuidado com dados sensíveis

### 7A.4 - Central de notificações e alertas operacionais

Prioridade:

- média

Impacto:

- melhora prevenção de falhas e acompanhamento diário

Risco:

- médio, precisa definir critérios de prioridade

### 7A.5 - Automação de backup externo fora do Supabase

Prioridade:

- alta

Impacto:

- reduz risco operacional e dependência de backup manual

Risco:

- médio/alto, não pode expor chaves sensíveis

## Priorização recomendada

Melhor ordem técnica:

1. 7A.2 - UX mobile dos fluxos mais usados
2. 7A.1 - Painel de backlog/melhorias no frontend
3. 7A.5 - Automação de backup externo
4. 7A.3 - Exportação XLS/CSV
5. 7A.4 - Central de notificações

## Justificativa

A prioridade maior deve ser 7A.2 porque o sistema já está estável e o maior ganho imediato vem de reduzir erro no uso diário em campo/celular.

A 7A.1 vem em seguida porque dá visibilidade e controle das melhorias futuras.

A 7A.5 é importante, mas envolve segurança e integrações externas, então precisa ser feita com mais cautela.

## Status

Fase 7A aberta.

## Próxima etapa recomendada

7A.2 - Melhorar UX mobile dos fluxos mais usados.

Motivo:

- maior impacto operacional imediato
- reduz erro humano
- melhora uso em celular
- não exige alteração estrutural pesada no banco
