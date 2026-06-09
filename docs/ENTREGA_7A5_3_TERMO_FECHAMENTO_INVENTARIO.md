# 7A.5.3 - Termo de fechamento do inventário

## Objetivo

Implementar o termo formal de fechamento do inventário.

## Backend

Migration aplicada:

- inventario_7a5_3_termo_fechamento

Campos adicionados em inventarios_contagens:

- termo_status
- termo_responsavel
- termo_auditor
- termo_observacoes
- termo_gerado_por
- termo_gerado_em
- termo_hash

RPCs criadas:

- rpc_registrar_termo_inventario_7a5_3
- rpc_termo_inventario_7a5_3

## Frontend

Arquivo criado:

- clean/inventario_termo.js

HTML atualizado:

- clean/inventario_termo.js?v=1

## Regras

O termo não altera estoque.
O termo não corrige divergência.
O termo apenas formaliza o resultado final do inventário.

Status possíveis:

- aprovado
- aprovado_com_ressalva
- reprovado

## PDF do termo

O PDF contém:

- identificação do inventário
- local inventariado
- status final
- resumo da conferência
- observações e ressalvas
- declaração formal
- assinatura do responsável
- assinatura do gestor/auditor
- hash de validação

## Segurança

Acesso restrito a perfil com auditoria ou admin.
Toda gravação gera audit_log.
