# Entrega 5W.2 - Bloqueio de duplicidade e controle de periodo fechado

Data: 2026-06-08

## Objetivo

Impedir dois problemas críticos no fechamento operacional:

1. Fechamento duplicado ou sobreposto com outro fechamento Fechado.
2. Novas movimentações registradas dentro de um período já fechado.

## Regra principal

Somente fechamento com status Fechado bloqueia período.

Fechamento com status Cancelado:

- permanece no histórico
- não bloqueia novo fechamento
- não bloqueia movimentações

## Backend implementado

### Funções criadas

- public.app_periodo_fechado_info(date)
- public.app_assert_periodo_aberto(date, text)
- public.app_assert_fechamento_sem_sobreposicao(date, date, uuid)
- public.rpc_validar_periodo_fechamento_5w2(date, date)

### Triggers criadas

#### public.movimentos

Trigger:

- movimentos_periodo_aberto_5w2

Função:

- public.trg_movimentos_periodo_aberto_5w2

Bloqueia insert/update em public.movimentos quando a data do movimento cai dentro de período Fechado.

Data usada:

- movimentos.data
- fallback: movimentos.created_at::date
- fallback: current_date

#### public.materiais_movimentos

Trigger:

- materiais_movimentos_periodo_aberto_5w2

Função:

- public.trg_materiais_movimentos_periodo_aberto_5w2

Bloqueia insert/update em public.materiais_movimentos quando created_at::date cai dentro de período Fechado.

#### public.fechamentos_operacionais

Trigger:

- fechamentos_sem_sobreposicao_5w2

Função:

- public.trg_fechamentos_sem_sobreposicao_5w2

Bloqueia fechamento com status Fechado que sobreponha outro fechamento Fechado.

## RPC de criação atualizada

A RPC abaixo foi atualizada:

- public.rpc_criar_fechamento_operacional_5w

Agora ela chama:

- public.app_assert_fechamento_sem_sobreposicao

Antes de criar o fechamento.

Também grava no payload:

- controle_periodo

Indicando que o período Fechado passa a bloquear novas movimentações.

## RPC de validação para frontend

Criada:

- public.rpc_validar_periodo_fechamento_5w2

Retorna:

- ok
- periodo_inicio
- periodo_fim
- bloqueado_por_sobreposicao
- fechamentos_sobrepostos
- dias_fechados_no_periodo

## Testes executados com rollback

Foi criado um fechamento Fechado temporário para ontem dentro de transação.

### Teste 1 - validação do período

Resultado:

- bloqueado_por_sobreposicao = true
- fechamentos_sobrepostos retornou o fechamento temporário
- dias_fechados_no_periodo retornou a data fechada

### Teste 2 - fechamento sobreposto

Tentativa de criar outro fechamento no mesmo período.

Resultado:

- bloqueado corretamente
- erro: já existe fechamento Fechado sobreposto

### Teste 3 - movimento patrimonial dentro do período fechado

Tentativa de inserir registro em public.movimentos na data fechada.

Resultado:

- bloqueado corretamente
- erro: período fechado bloqueia movimentação

### Teste 4 - movimento de material dentro do período fechado

Tentativa de inserir registro em public.materiais_movimentos na data fechada.

Resultado:

- bloqueado corretamente
- erro: período fechado bloqueia movimentação

A transação foi finalizada com rollback.

## Situação real atual

Existe 1 fechamento real no banco:

- status = Cancelado
- total = 1

Como está Cancelado, ele não bloqueia o período.

Validação direta:

- periodo_cancelado_bloqueia = false

## Frontend atualizado

Arquivo alterado:

- clean/fechamento.js

Cache atualizado em:

- index-clean.html

Agora carrega:

- clean/fechamento.js?v=3

## Funcionalidades adicionadas na tela

### Botão Validar período

Chama:

- rpc_validar_periodo_fechamento_5w2

Mostra:

- período livre
- período bloqueado
- fechamento sobreposto
- protocolo do fechamento sobreposto
- responsável

### Bloqueio antes da prévia

Gerar prévia agora valida o período antes.

Se houver fechamento Fechado sobreposto, bloqueia a prévia.

### Bloqueio antes de confirmar

Confirmar fechamento agora valida o período novamente antes de chamar a RPC.

Isso evita corrida entre prévia e confirmação.

### Mensagem operacional

Ao confirmar fechamento, a tela avisa:

- após confirmado, novas movimentações dentro do período serão bloqueadas

### Cancelamento

Ao cancelar fechamento Fechado:

- o fechamento fica Cancelado
- o período deixa de bloquear movimentações
- o período pode ser refeito em novo fechamento

## Roteiro de teste

Abrir:

/index-clean.html?v=5w2-periodo-fechado

Testar:

1. Fazer login.
2. Abrir Fechamento.
3. Selecionar período já cancelado: 2026-06-01 até 2026-06-08.
4. Clicar Validar período.
5. Confirmar que aparece livre, pois fechamento Cancelado não bloqueia.
6. Criar um fechamento real de teste somente se for operacionalmente correto.
7. Após criar, tentar validar o mesmo período.
8. Confirmar que o período aparece bloqueado.
9. Tentar gerar prévia do mesmo período.
10. Confirmar bloqueio por sobreposição.

## Observação importante

Se você fechar um período que inclui a data atual, qualquer nova movimentação com data atual será bloqueada depois do fechamento.

Melhor prática operacional:

- fechar períodos já encerrados
- exemplo: fechar até ontem
- evitar fechar o dia atual se ainda houver movimentação em andamento

## Status

5W.2 concluída.

## Próxima etapa recomendada

5W.3 - Relatório de impacto de período fechado.

Objetivo:

Mostrar quais movimentações entraram no período antes do fechamento, quais tentativas foram bloqueadas depois e facilitar conferência por período fechado.
