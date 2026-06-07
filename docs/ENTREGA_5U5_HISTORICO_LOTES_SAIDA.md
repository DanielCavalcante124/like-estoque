# Entrega 5U.5 - Historico/relatorio de lotes de saida

Data: 2026-06-07

## Objetivo

Criar historico consultavel dos lotes confirmados pela Operacao rapida.

## Problema tecnico identificado

O audit_log registrava o protocolo base da Operacao rapida, mas os movimentos individuais recebiam client_operation_id derivado por item.

Isso impedia reconstruir o lote completo com confiabilidade apenas a partir de audit_log, movimentos e materiais_movimentos.

## Melhor decisao tecnica aplicada

Criar persistencia propria para lotes:

- saidas_lote
- saidas_lote_itens

E atualizar a RPC de saida em lote para gravar o snapshot completo no momento da confirmacao.

## Backend criado/alterado

### Tabelas criadas

- public.saidas_lote
- public.saidas_lote_itens

### Campos principais de saidas_lote

- protocolo
- created_at
- user_id
- tecnico
- os
- observacao
- equipamentos_count
- materiais_count
- resumo

### Campos principais de saidas_lote_itens

- lote_id
- protocolo
- item_tipo
- equipamento_id
- modelo_id
- codigo
- patrimonio
- mac
- serial
- tipo
- marca
- modelo
- categoria
- unidade_saida
- quantidade
- status_final
- tecnico
- os
- observacao

### RLS

As tabelas foram criadas com RLS ativado e leitura permitida para usuarios autenticados.

### RPC atualizada

- rpc_operacao_rapida_saida_lote

Agora a RPC grava:

- audit_log
- movimentos de equipamentos
- movimentos de materiais
- cabeçalho do lote
- itens do lote

### RPC criada/atualizada

- rpc_historico_lotes_saida

Parametros:

- p_busca text
- p_data_ini date
- p_data_fim date
- p_limit int

Retorno:

- JSON com lotes
- dados do lote
- equipamentos do lote
- materiais do lote

## Teste backend executado

Foi executado teste com rollback:

- 1 equipamento Em estoque
- 1 material com saldo central
- tecnico de teste
- OS de teste
- protocolo fixo de teste

Resultado:

- lote retornou pelo protocolo
- equipamentos_count = 1
- materiais_count = 1
- detalhe do equipamento retornou
- detalhe do material retornou
- transacao desfeita com rollback

## Frontend criado

Arquivo:

- clean/lotes_saida.js

Tela criada:

- Lotes de saida

Recursos:

- filtro por busca livre
- filtro por data inicial
- filtro por data final
- limite de registros
- lista de lotes
- KPIs de total, equipamentos, materiais e ultimo lote
- detalhe do lote selecionado
- lista de equipamentos
- lista de materiais
- PDF do lote
- copiar comprovante para WhatsApp

## HTML atualizado

index-clean.html agora carrega:

- clean/lotes_saida.js?v=1

## Teste recomendado

Abrir:

/index-clean.html?v=5u5

Roteiro:

1. Fazer login.
2. Abrir Operacao rapida.
3. Confirmar uma saida real ou usar uma ja confirmada apos esta etapa.
4. Abrir Lotes de saida.
5. Clicar Buscar lotes.
6. Filtrar por tecnico, OS, protocolo, MAC, SN, codigo ou material.
7. Selecionar um lote.
8. Conferir equipamentos.
9. Conferir materiais.
10. Clicar WhatsApp.
11. Colar o texto e conferir.
12. Clicar PDF.
13. Conferir o comprovante gerado.

## Observacao importante

Lotes confirmados antes da criacao das tabelas saidas_lote e saidas_lote_itens podem aparecer apenas no audit_log antigo e nao terao detalhe completo nessa tela.

A partir desta entrega, os novos lotes confirmados pela Operacao rapida ficam persistidos com detalhe completo.

## Status

5U.5 concluida.

## Proxima etapa recomendada

5U.6 - Validacao operacional completa da Operacao rapida.

Foco:

- confirmar saida real pequena
- verificar historico de equipamento
- verificar tecnico
- verificar lote de saida
- verificar PDF
- verificar WhatsApp
- verificar relatorios
