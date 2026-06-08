# Entrega 5V.2.4 - Correcao em lote segura das divergencias atuais

Data: 2026-06-08

## Objetivo

Corrigir em lote as divergencias atuais de Local invalido apontadas pela Auditoria, usando RPC segura com dry-run, validacao e historico.

A correcao so foi feita depois da etapa 5V.2.3, que travou a causa raiz nos fluxos de saida.

## RPC criada

- public.rpc_corrigir_locais_divergentes_lote_5v24

## Parametros

- p_novo_local text default Backup tecnico
- p_motivo text
- p_responsavel text
- p_dry_run boolean default true
- p_limite integer default 100
- p_client_operation_id uuid

## Caracteristicas de seguranca

A RPC:

1. Exige permissao operacional.
2. Valida novo local ativo em public.locais.
3. Exige motivo com pelo menos 8 caracteres.
4. Tem modo dry-run.
5. Tem limite maximo de 500 itens.
6. Busca somente divergencias atuais da Auditoria categoria Local invalido.
7. Usa a RPC individual rpc_corrigir_local_divergente_5v21 para cada equipamento.
8. Registra movimento individual por equipamento.
9. Usa client_operation_id derivado para idempotencia.
10. Registra log em audit_log.

## Dry-run executado

O dry-run encontrou 5 divergencias atuais:

- EQP-0004: Tecnico -> Backup tecnico
- EQP-0009: backup -> Backup tecnico
- EQP-0014: Tecnico -> Backup tecnico
- EQP-0015: BRUNO THIAGO -> Backup tecnico
- EQP-0016: BRUNO THIAGO -> Backup tecnico

Observacao:

Antes haviam 6 divergencias historicas, mas no momento da correcao em lote a auditoria atual retornou 5.

## Correcao real executada

Resultado:

- encontrados = 5
- corrigidos = 5
- erros = 0

Equipamentos corrigidos:

- EQP-0004
- EQP-0009
- EQP-0014
- EQP-0015
- EQP-0016

Todos foram corrigidos para:

- local = Backup tecnico

Preservando:

- status = Com tecnico
- tecnico_atual original

## Movimentos gerados

A correcao gerou movimentos individuais de auditoria para cada equipamento, via rpc_corrigir_local_divergente_5v21.

Movimentos registrados:

- EQP-0004: 413ca51d-ef12-4db8-90ff-f49f251a8412
- EQP-0009: d83246e0-e2f2-4a9b-9592-eaa49ff3c396
- EQP-0014: 2e904908-fa57-4ded-8033-b00e39da8984
- EQP-0015: b02c5637-3c77-46e8-ae83-817ec5658648
- EQP-0016: 7c56be37-dae7-40af-9057-b3e6ee871faf

## Validacao final

Auditoria geral apos correcao:

- total = 0
- criticas = 0
- altas = 0
- medias = 0
- baixas = 0

Auditoria Local invalido apos correcao:

- total = 0
- criticas = 0
- altas = 0
- medias = 0
- baixas = 0

Lista de divergencias Local invalido:

- vazia

## Status

5V.2.4 concluida.

## Proxima etapa recomendada

5V.3 - Auditoria preventiva automatica no dashboard.

Objetivo:

Exibir no dashboard se existem novas divergencias de auditoria sem precisar abrir a tela Auditoria manualmente.
