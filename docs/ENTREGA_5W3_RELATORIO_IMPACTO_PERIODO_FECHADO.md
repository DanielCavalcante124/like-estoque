# Entrega 5W.3 - Relatorio de impacto de periodo fechado

Data: 2026-06-08

## Objetivo

Criar um relatorio de impacto por fechamento/periodo para conferir quais movimentacoes compoem um periodo fechado e identificar se existem movimentos apos a criacao do fechamento.

## Observacao tecnica importante

Tentativas bloqueadas por trigger nao ficam registradas nas tabelas de movimentos, porque o PostgreSQL reverte a transacao quando a trigger lança erro.

Portanto, este relatorio mostra:

- movimentos que entraram no periodo
- movimentos antes da criacao do fechamento
- movimentos apos a criacao do fechamento, se existirem
- materiais movimentados no periodo
- materiais antes/depois da criacao do fechamento
- dias do periodo e quantidade de movimentos por dia
- se existe fechamento Fechado bloqueando o periodo

Para registrar tentativas bloqueadas no futuro, sera necessaria uma etapa separada com pre-validacao explicita no frontend/RPC antes de tentar movimentar.

## Backend

### RPC criada

- public.rpc_relatorio_impacto_periodo_fechado_5w3

Parametros:

- p_fechamento_id uuid default null
- p_periodo_inicio date default null
- p_periodo_fim date default null

Uso:

1. Se informar fechamento_id, o relatorio usa o periodo do fechamento.
2. Se nao informar fechamento_id, usa periodo_inicio e periodo_fim manuais.

## Dados retornados

A RPC retorna:

- ok
- gerado_em
- periodo_inicio
- periodo_fim
- fechamento de referencia
- controle do periodo
- fechamentos sobrepostos
- resumo de movimentos patrimoniais
- resumo de movimentos de materiais
- lista de movimentos patrimoniais
- lista de movimentos de materiais
- resumo por dia
- auditoria atual

## Classificacao de momento

Quando existe fechamento de referencia, cada movimento recebe:

- antes_do_fechamento
- apos_o_fechamento

Quando o relatorio e manual sem fechamento:

- sem_fechamento_referencia

## Limites de detalhe

Para evitar resposta pesada:

- ate 300 movimentos patrimoniais detalhados
- ate 300 movimentos de materiais detalhados

A tela limita visualmente a 120 itens por tabela.
O PDF limita a 80 itens por tabela.

## Frontend

Arquivo criado:

- clean/fechamento_impacto.js

Arquivo alterado:

- index-clean.html

## Tela adicionada

Dentro da tela Fechamento foi adicionado o card:

- Relatorio de impacto do periodo fechado

Campos/controles:

- selecionar fechamento salvo
- usar periodo manual da tela
- gerar impacto
- baixar PDF jsPDF
- copiar resumo WhatsApp
- recarregar fechamentos

## PDF jsPDF

O PDF contem:

- periodo
- fechamento/protocolo/status
- se o periodo esta bloqueado
- observacao sobre tentativas bloqueadas
- resumo de impacto
- movimentos por tipo
- movimentos patrimoniais
- movimentos de materiais

Nome do arquivo:

- impacto_periodo_DATAINICIO_DATAFIM.pdf

## WhatsApp

O resumo WhatsApp contem:

- periodo
- fechamento/status/protocolo
- se bloqueia periodo
- total de patrimonio
- patrimonio antes/depois
- total de materiais
- materiais antes/depois
- observacao tecnica sobre tentativas bloqueadas

## Cache atualizado

index-clean.html agora carrega:

- clean/fechamento.js?v=3
- clean/fechamento_impacto.js?v=1

## Validacao executada

Foi validado o ultimo fechamento real salvo.

Resultado:

- periodo_inicio = 2026-06-07
- periodo_fim = 2026-06-07
- status_fechamento = Cancelado
- bloqueado = false
- movimentos_total = 31
- movimentos_antes = 31
- movimentos_apos = 0
- materiais_total = 6
- materiais_antes = 6
- materiais_apos = 0

Interpretacao:

Como o fechamento esta Cancelado, ele nao bloqueia o periodo.
Mesmo assim, o relatorio consegue mostrar tudo que compoe aquele periodo.

## Roteiro de teste

Abrir:

/index-clean.html?v=5w3-impacto-periodo

Testar:

1. Fazer login.
2. Abrir Fechamento.
3. Ir ao card Relatorio de impacto do periodo fechado.
4. Selecionar um fechamento salvo.
5. Clicar Gerar impacto.
6. Conferir KPIs de patrimonio e materiais.
7. Conferir tabela de movimentos patrimoniais.
8. Conferir tabela de materiais.
9. Baixar PDF jsPDF.
10. Copiar resumo WhatsApp.
11. Testar tambem com periodo manual sem selecionar fechamento.

## Status

5W.3 concluida.

## Proxima etapa recomendada

5X - Controle de permissao por perfil nas operacoes criticas.

Objetivo:

Separar o que cada perfil pode fazer:

- admin
- gestor
- suporte
- tecnico
- somente leitura

Bloquear no banco e no frontend operacoes como baixa, cancelamento de fechamento, correcao de auditoria e cadastro estrutural.
