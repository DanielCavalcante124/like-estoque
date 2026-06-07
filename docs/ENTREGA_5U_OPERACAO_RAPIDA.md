# Entrega 5U - Operacao rapida limpa

Data: 2026-06-07

## Objetivo

Iniciar a migracao da Operacao rapida da versao em producao para a versao limpa.

## Melhor decisao tecnica adotada

Nao copiar o codigo antigo da producao diretamente.

Motivo:

- a producao fazia parte da operacao rapida com updates diretos no frontend
- a versao limpa deve usar RPC no Supabase para operacoes criticas
- isso reduz risco de saida parcial, inconsistencia e divergencia de historico

## Backend criado

RPC criada:

- rpc_operacao_rapida_saida_lote

Parametros:

- p_equipamentos uuid[]
- p_materiais jsonb
- p_tecnico text
- p_observacao text
- p_os text
- p_client_operation_id uuid

Retorno:

- jsonb com resumo da operacao

## Seguranca da RPC

A RPC:

- exige usuario autenticado com permissao operacional
- bloqueia carrinho vazio
- exige tecnico
- valida se materiais foram enviados em lista
- valida quantidade maior que zero
- valida material fechado somente em quantidade inteira
- valida equipamento ativo
- aceita equipamento somente se estiver Em estoque ou Reservado
- reutiliza as RPCs/core ja existentes para saida de equipamento e material
- grava audit_log da operacao
- executa dentro da transacao da propria funcao

## Frontend criado

Arquivo:

- clean/operacao_rapida.js

Recursos criados:

- menu Operacao rapida
- busca universal
- busca por MAC, SN, codigo, patrimonio, tecnico, cliente, OS, modelo e material
- leitura por bip usando Enter
- resultado de equipamentos com status e acoes
- resultado de materiais com quantidade
- carrinho de equipamentos
- carrinho de materiais
- selecionar tecnico
- campo OS/referencia
- campo observacao
- confirmar saida em lote via RPC
- copiar mensagem para WhatsApp
- limpar carrinho
- KPIs rapidos
- alertas rapidos
- atalhos para Entrada, Entrada em lote, Materiais, Devolucao, Historico e Relatorios

## Arquivo HTML atualizado

index-clean.html agora carrega:

- clean/operacao_rapida.js?v=1

## Limites desta primeira entrega

Esta entrega ja permite usar a operacao rapida para saida em lote, mas ainda faltam melhorias futuras:

- PDF/relatorio do carrinho confirmado
- historico visual do lote confirmado
- filtro separado por equipamento/material
- melhoria de leitura por bip de materiais
- tela de conferencia final antes de confirmar
- relatorios gerenciais avancados da antiga producao

## Teste recomendado

Abrir:

/index-clean.html?v=5u

Teste seguro:

1. Fazer login.
2. Abrir Operacao rapida.
3. Buscar um equipamento Em estoque.
4. Clicar Adicionar.
5. Buscar um equipamento Com tecnico ou Baixado.
6. Conferir se Adicionar fica bloqueado.
7. Buscar um material com saldo central.
8. Informar quantidade.
9. Clicar Adicionar material.
10. Selecionar tecnico.
11. Informar OS/Referencia opcional.
12. Clicar Copiar WhatsApp.
13. Conferir a mensagem.
14. Clicar Confirmar saida somente se os itens forem de teste/operacao real.

## Status

5U inicial concluida.

## Proxima etapa recomendada

5U.2 - Ajustar e testar Operacao rapida em uso real.

Foco:

- corrigir qualquer problema de selecao no carrinho
- validar saida de equipamento
- validar saida de material
- validar mensagem WhatsApp
- validar historico gerado
