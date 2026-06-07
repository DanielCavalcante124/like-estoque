# Entrega 1 - Resumo

Data: 2026-06-07

## Objetivo

Preparar o banco para uma etapa futura de app Windows e modo offline.

## Alteracoes aplicadas

- Criado schema de copia interna das tabelas principais: backup_like_20260607.
- Criada tabela user_profiles para perfis de acesso.
- Criada tabela audit_log para registro leve de eventos.
- Criados campos de baixa logica na tabela equipamentos.
- Criado campo client_operation_id em movimentos e materiais_movimentos.
- Criados indices essenciais para historico e consultas.
- Criada funcao rpc_baixar_equipamento.

## Impacto

O app atual deve continuar funcionando.

## Proximo passo

Atualizar o frontend para chamar rpc_baixar_equipamento no fluxo de baixa de equipamento.
