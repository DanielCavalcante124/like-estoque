# 7A.5.2 - Relatório e correção guiada do inventário

## Objetivo

Criar relatório do inventário por bipagem e permitir correção guiada de divergências de local.

## Backend

Funções criadas:

- rpc_relatorio_inventario_7a5_2
- rpc_corrigir_divergencia_inventario_7a5_2

## Frontend

Arquivo criado:

- clean/inventario_relatorio.js

HTML atualizado:

- clean/inventario_relatorio.js?v=1

## Regras de segurança

A correção guiada só permite corrigir bips com resultado:

- divergente

Não corrige automaticamente:

- não encontrado
- inativo
- faltante
- duplicado

## O que a correção faz

Quando aprovada pelo usuário:

- exige motivo com pelo menos 8 caracteres
- atualiza o local do equipamento para o local alvo do inventário
- registra movimento do tipo Correção inventário
- registra audit_log
- atualiza o bip para OK

## O que a correção não faz

- não cria equipamento novo
- não reativa equipamento baixado
- não corrige item faltante automaticamente
- não altera material
- não mexe em saldo

## Tela criada

Nova aba:

- Relatório Inventário

Recursos:

- seleção de inventário
- resumo por KPI
- lista de bips
- lista de faltantes
- exportação CSV
- exportação PDF
- botão de correção para divergentes

## Status

Implementado para teste controlado.
