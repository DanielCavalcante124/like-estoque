# Entrega 5W.1 - Cancelamento controlado de fechamento

Data: 2026-06-08

## Objetivo

Permitir cancelar um fechamento operacional salvo sem apagar o registro do banco.

Regra principal:

- fechamento formal nao deve ser deletado
- fechamento incorreto deve ser marcado como Cancelado
- motivo, responsavel, data/hora e protocolo de cancelamento devem ficar salvos
- audit_log deve registrar a operacao

## Backend

### Colunas adicionadas em public.fechamentos_operacionais

- cancelado_em timestamptz
- cancelado_por uuid
- cancelado_responsavel text
- cancelado_motivo text
- cancelamento_protocolo uuid

### RPC criada

- public.rpc_cancelar_fechamento_operacional_5w1

Parametros:

- p_fechamento_id uuid
- p_motivo text
- p_responsavel text
- p_client_operation_id uuid

## Validacoes da RPC

A RPC valida:

1. usuario com permissao operacional
2. fechamento informado
3. fechamento existente
4. motivo com pelo menos 12 caracteres
5. somente status Fechado pode ser cancelado
6. idempotencia por protocolo de cancelamento

## Comportamento

Ao cancelar, a RPC:

1. bloqueia o fechamento com FOR UPDATE
2. altera status para Cancelado
3. preenche cancelado_em
4. preenche cancelado_por
5. preenche cancelado_responsavel
6. preenche cancelado_motivo
7. preenche cancelamento_protocolo
8. adiciona dados de cancelamento no payload JSON
9. atualiza updated_at
10. registra audit_log

## Listagem atualizada

A RPC de listagem foi atualizada:

- public.rpc_listar_fechamentos_operacionais_5w

Agora retorna tambem:

- cancelado_em
- cancelado_por
- cancelado_responsavel
- cancelado_motivo
- cancelamento_protocolo
- updated_at

## Teste backend

Foi criado um fechamento temporario dentro de transacao.

Em seguida foi chamada a RPC de cancelamento.

Resultado esperado confirmado:

- ok = true
- status = Cancelado
- cancelado_em preenchido
- cancelado_por preenchido
- cancelado_responsavel preenchido
- cancelado_motivo preenchido
- cancelamento_protocolo preenchido
- payload recebeu bloco cancelamento

A transacao foi encerrada com rollback.

## Situacao real apos teste

Existe 1 fechamento real salvo atualmente:

- total_fechamentos = 1
- fechados = 1
- cancelados = 0

Ou seja, o teste com rollback nao cancelou nenhum fechamento real.

## Frontend

Arquivo alterado:

- clean/fechamento.js

Arquivo alterado para cache:

- index-clean.html

## Funcionalidades adicionadas na tela

### Botao Cancelar

No historico de fechamentos, registros com status Fechado exibem:

- Cancelar

Registros Cancelados nao exibem o botao.

### Fluxo de cancelamento

Ao clicar Cancelar:

1. valida se o fechamento existe no historico carregado
2. valida se status = Fechado
3. pergunta responsavel pelo cancelamento
4. pergunta motivo do cancelamento
5. exige motivo com pelo menos 12 caracteres
6. pede confirmacao final
7. chama rpc_cancelar_fechamento_operacional_5w1
8. renderiza fechamento cancelado
9. gera PDF jsPDF do fechamento cancelado
10. recarrega historico

### Exibicao de cancelamento

Quando o fechamento estiver Cancelado, a tela mostra:

- data/hora do cancelamento
- responsavel pelo cancelamento
- motivo
- protocolo do cancelamento

### WhatsApp

O resumo WhatsApp agora inclui status do fechamento.

Se estiver cancelado, inclui tambem:

- protocolo de cancelamento
- responsavel
- data
- motivo

### PDF jsPDF

O PDF agora inclui status.

Se o fechamento estiver cancelado, inclui tambem:

- motivo do cancelamento
- responsavel pelo cancelamento
- data/hora
- protocolo de cancelamento

O nome do PDF passa a incluir cancelado quando aplicavel:

- fechamento_operacional_cancelado_DATAINICIO_DATAFIM.pdf

## Cache atualizado

index-clean.html agora carrega:

- clean/fechamento.js?v=2

## Roteiro de teste

Abrir:

/index-clean.html?v=5w1-cancelamento-fechamento

Testar:

1. Fazer login.
2. Abrir Fechamento.
3. Conferir historico.
4. Localizar fechamento com status Fechado.
5. Clicar Cancelar.
6. Informar responsavel.
7. Informar motivo com pelo menos 12 caracteres.
8. Confirmar cancelamento.
9. Conferir se status mudou para Cancelado.
10. Conferir se botao Cancelar sumiu desse fechamento.
11. Conferir se PDF jsPDF foi baixado.
12. Conferir se PDF mostra motivo e protocolo do cancelamento.
13. Recarregar pagina e confirmar que o status continua Cancelado.

## Status

5W.1 concluida.

## Proxima etapa recomendada

5W.2 - Reabertura controlada/bloqueada de periodo.

Decisao recomendada:

Nao permitir reabrir fechamento automaticamente. Se for necessario refazer, criar novo fechamento corrigido e manter o anterior cancelado.
