# Entrega 3 - RPCs de materiais

Data: 2026-06-07

## Objetivo

Mover a movimentacao de materiais para funcoes transacionais no Supabase.

Antes, o frontend fazia varias chamadas separadas:

1. atualizava saldo de origem
2. atualizava saldo de destino
3. inseria historico

Isso gerava risco de inconsistencia se uma chamada falhasse no meio.

## Migration aplicada

- entrega_3_rpcs_materiais

## Funcoes criadas

- like_material_categoria
- like_material_unidade
- like_get_or_create_material_saldo
- rpc_movimentar_material
- rpc_entrada_material
- rpc_saida_material_tecnico
- rpc_consumo_material_tecnico

## Indice criado

- materiais_saldos_unique_norm

Esse indice evita duplicidade de saldo considerando tecnico nulo como string vazia. Isso corrige uma fragilidade do indice antigo, porque em PostgreSQL valores NULL em unique index podem permitir duplicidade.

## Alteracao no frontend

Arquivo alterado:

- materiais_main.js

Fluxos alterados:

- entrada de material chama rpc_entrada_material
- saida para tecnico chama rpc_saida_material_tecnico
- baixa por uso chama rpc_consumo_material_tecnico

## Regras protegidas no banco

- quantidade deve ser maior que zero
- material fechado exige quantidade inteira
- saldo negativo e bloqueado
- movimentacao gera historico
- client_operation_id evita duplicidade futura
- saldo origem/destino e movimento ficam na mesma transacao

## Preparacao para Windows/offline

As funcoes aceitam client_operation_id. Isso permite reenvio seguro quando o app Windows tiver fila local offline.

## Pendencias

- Criar RLS por perfil.
- Remover permissive policies antigas.
- Migrar cadastros para RPCs.
- Refatorar frontend em modulos.
- Criar testes operacionais antes do merge para main.
