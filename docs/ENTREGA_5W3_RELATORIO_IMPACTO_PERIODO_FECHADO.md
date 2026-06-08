# Entrega 5W.3 - Relatorio de impacto de periodo fechado

Data: 2026-06-08

## Objetivo

Criar um relatorio para conferir o impacto de um periodo fechado ou de um periodo manual, mostrando:

- status do fechamento
- se o periodo esta bloqueado
- movimentos patrimoniais que compoem o periodo
- movimentos de materiais que compoem o periodo
- resumo por tipo
- resumo por dia
- resumo por origem
- movimentos posteriores ao fechamento dentro do periodo, se existirem
- PDF jsPDF
- resumo WhatsApp

## Observacao tecnica importante

Tentativas bloqueadas por trigger nao ficam persistidas automaticamente no PostgreSQL.

Motivo:

- o trigger usa RAISE EXCEPTION para bloquear
- a transacao inteira e revertida
- qualquer log inserido dentro da mesma transacao tambem seria revertido

Portanto a 5W.3 registra e exibe:

- movimentos que entraram no periodo
- movimentos posteriores indevidos dentro do periodo, se existirem
- status de bloqueio do periodo

Para registrar tentativa bloqueada como log persistente, a solucao correta futura e validar pela camada de aplicacao/RPC antes de tentar inserir o movimento, ou usar um servico externo de log.

## Backend

### RPC criada

- public.rpc_relatorio_impacto_periodo_fechado_5w3

Parametros:

- p_fechamento_id uuid default null
- p_periodo_inicio date default null
- p_periodo_fim date default null

Regra:

- se p_fechamento_id for informado, usa o periodo do fechamento
- se nao for informado, exige periodo_inicio e periodo_fim

## Retorno da RPC

Retorna JSON com:

- ok
- resumo
- fechamento
- movimentos_patrimonio
- movimentos_materiais
- pos_fechamento

### resumo

Inclui:

- periodo_inicio
- periodo_fim
- fechamento_id
- fechamento_status
- fechamento_protocolo
- fechamento_created_at
- periodo_bloqueado
- total_movimentos_patrimonio
- total_movimentos_materiais
- quantidade_materiais
- movimentos_patrimonio_apos_fechamento
- materiais_apos_fechamento
- observacao_tecnica

### movimentos_patrimonio

Inclui:

- total
- por_tipo
- por_dia
- por_origem
- itens

### movimentos_materiais

Inclui:

- total
- quantidade_total
- por_tipo
- por_dia
- por_origem
- itens

### pos_fechamento

Inclui:

- movimentos_patrimonio_apos_fechamento
- materiais_apos_fechamento

## Correcao aplicada na RPC

Durante a validacao inicial, foi identificado erro no calculo de quantidade_total de materiais porque o resumo principal nao estava referenciando public.materiais_movimentos.

Correcao aplicada na migration:

- corrigir_rpc_impacto_materiais_5w3

## Validacao no banco

Foi validado usando o fechamento real existente.

Resultado do resumo:

- fechamento_status = Cancelado
- periodo_bloqueado = false
- total_movimentos_patrimonio = 31
- total_movimentos_materiais = 6
- quantidade_materiais = 42
- movimentos_patrimonio_apos_fechamento = 0
- materiais_apos_fechamento = 0

Como o fechamento esta Cancelado, o periodo nao bloqueia movimentacoes, comportamento esperado.

## Frontend

Arquivo criado:

- clean/impacto_fechamento.js

Arquivo alterado:

- index-clean.html

## Tela criada

Menu:

- Impacto fechamento

Campos:

- fechamento salvo
- data inicial
- data final
- observacao para PDF/conferencia

Botoes:

- Recarregar fechamentos
- Gerar relatorio
- Baixar PDF jsPDF
- Copiar resumo WhatsApp

## Componentes visuais

A tela exibe:

- KPIs de impacto
- card de controle do periodo
- patrimonio por tipo
- materiais por tipo
- patrimonio por dia
- materiais por dia
- tabela de movimentos patrimoniais
- tabela de movimentos de materiais

## PDF jsPDF

O PDF inclui:

- periodo
- status do fechamento
- se o periodo esta bloqueado
- protocolo
- data de criacao do fechamento
- observacao
- resumo de impacto
- conclusao
- observacao tecnica
- patrimonio por tipo
- materiais por tipo
- amostra de movimentos patrimoniais
- amostra de movimentos de materiais

Arquivo gerado:

- impacto_periodo_DATAINICIO_DATAFIM.pdf

## WhatsApp

O resumo WhatsApp inclui:

- periodo
- status do fechamento
- periodo bloqueado ou nao
- protocolo
- total de movimentos patrimoniais
- total de movimentos materiais
- quantidade de materiais
- movimentos pos-fechamento
- conclusao

## Cache atualizado

index-clean.html agora carrega:

- clean/impacto_fechamento.js?v=1

## Roteiro de teste

Abrir:

/index-clean.html?v=5w3-impacto-periodo

Testar:

1. Fazer login.
2. Abrir Impacto fechamento.
3. Selecionar um fechamento no campo Fechamento.
4. Conferir se as datas sao preenchidas automaticamente.
5. Clicar Gerar relatorio.
6. Conferir KPIs.
7. Conferir Controle do periodo.
8. Conferir tabelas por tipo e por dia.
9. Conferir movimentos patrimoniais e materiais.
10. Clicar Copiar resumo WhatsApp.
11. Clicar Baixar PDF jsPDF.

## Status

5W.3 concluida.

## Proxima etapa recomendada

5X - Consolidacao final do modulo financeiro/operacional do estoque.

Objetivo:

Unificar relatorios gerenciais, fechamento e impacto em uma area unica de analise operacional com visao executiva e documentos PDF padronizados.
