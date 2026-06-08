# Entrega 5V.2.1 - RPC de correcao guiada para divergencia de local

Data: 2026-06-08

## Objetivo

Criar uma RPC segura para corrigir divergencias de local apontadas pela auditoria 5V.1.

A correcao nao deve ser feita por update manual direto na tabela, porque precisa manter rastreabilidade e movimento de auditoria.

## RPC criada

- public.rpc_corrigir_local_divergente_5v21

## Parametros

- p_equipamento_id uuid
- p_novo_local text default 'Backup tecnico'
- p_motivo text
- p_responsavel text
- p_client_operation_id uuid

## Validacoes implementadas

A RPC valida:

1. Usuario autenticado com permissao operacional.
2. Equipamento informado.
3. Equipamento existente.
4. Equipamento ativo.
5. Novo local informado.
6. Novo local existente e ativo na tabela locais.
7. Motivo com pelo menos 8 caracteres.
8. Local atual realmente invalido.
9. Idempotencia por client_operation_id.

## Comportamento

Quando a correcao e aceita, a RPC:

1. Bloqueia o equipamento com FOR UPDATE.
2. Valida o local novo em public.locais.
3. Identifica o local antigo.
4. Atualiza equipamentos.local.
5. Preserva status, tecnico_atual, cliente_atual e os_atual.
6. Acrescenta motivo_atual com referencia de auditoria.
7. Insere movimento de historico em public.movimentos.
8. Retorna JSON com local anterior, local corrigido, movimento_id e client_operation_id.

## Movimento gerado

Tipo:

- Correcao de auditoria - local

Origem:

- Auditoria 5V.2.1

Destino:

- local corrigido

## Teste executado

Foi executado teste seguro com transacao e rollback no equipamento EQP-0002.

Resultado dentro da transacao:

- local mudou de Tecnico para Backup tecnico
- status permaneceu Com tecnico
- tecnico_atual permaneceu TESTE
- motivo_atual recebeu referencia da correcao

Depois do rollback:

- EQP-0002 continuou com local original Tecnico
- auditoria continuou com 6 divergencias

## Resultado atual da auditoria apos teste

- total = 6
- criticas = 0
- altas = 0
- medias = 6
- baixas = 0

## Observacao importante

A RPC nao corrige automaticamente todos os registros. Ela e uma correcao guiada por equipamento.

Isso e proposital para evitar alteracao em massa sem revisao operacional.

## Proxima etapa recomendada

5V.2.2 - Tela de correcao guiada das divergencias de local.

A tela deve permitir selecionar uma divergencia, escolher o novo local, informar motivo/responsavel e chamar a RPC com confirmacao.
