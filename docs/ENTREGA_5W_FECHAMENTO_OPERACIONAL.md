# Entrega 5W - Fechamento mensal/por periodo com assinatura operacional

Data: 2026-06-08

## Objetivo

Criar fechamento operacional formal por periodo com:

- periodo inicial e final
- responsavel
- observacao
- assinatura operacional
- saldo inicial
- saldo final
- movimentos do periodo
- auditoria no momento do fechamento
- divergencias registradas
- historico no banco
- PDF gerado em jsPDF
- resumo WhatsApp

## Backend

### Tabela criada

- public.fechamentos_operacionais

Campos principais:

- id
- protocolo
- periodo_inicio
- periodo_fim
- responsavel
- observacao
- status
- saldo_inicial
- saldo_final
- resumo_movimentos
- auditoria_resumo
- divergencias
- assinatura_nome
- assinatura_documento
- assinado_em
- payload
- created_by
- created_at
- updated_at

## Segurança

A tabela tem RLS habilitado.

Permissoes:

- authenticated pode consultar
- insert direto bloqueado
- update direto bloqueado
- criacao feita por RPC security definer

## RPCs criadas

### public.rpc_criar_fechamento_operacional_5w

Cria fechamento formal e salva no banco.

Valida:

- permissao operacional
- periodo preenchido
- periodo final maior ou igual ao inicial
- responsavel preenchido
- idempotencia por protocolo/client_operation_id

Gera:

- saldo inicial
- saldo final
- resumo de movimentos
- auditoria atual
- divergencias atuais
- assinatura operacional
- payload completo
- audit_log

### public.rpc_listar_fechamentos_operacionais_5w

Lista historico de fechamentos salvos.

Retorna:

- periodo
- responsavel
- observacao
- status
- saldo inicial
- saldo final
- movimentos
- auditoria
- divergencias
- assinatura
- payload

## Regra do saldo inicial

O primeiro fechamento formal nao possui fechamento anterior, portanto o saldo inicial e marcado como:

- sem_fechamento_anterior

Nos proximos fechamentos, o sistema usa o saldo final do ultimo fechamento anterior como saldo inicial de referencia.

Essa decisao evita inventar saldo inicial retroativo sem base historica confiavel.

## Frontend

Arquivo criado:

- clean/fechamento.js

Arquivo alterado:

- index-clean.html

## Tela criada

Menu:

- Fechamento

Campos:

- data inicial
- data final
- responsavel
- nome para assinatura operacional
- documento/matricula/identificacao
- observacao

Botoes:

- Gerar previa
- Confirmar fechamento
- Baixar PDF jsPDF
- Copiar resumo WhatsApp
- Recarregar historico

## Funcionalidades

### Gerar previa

Consulta:

- rpc_relatorio_gerencial_5v
- rpc_auditoria_divergencias_5v1

Monta uma previa sem salvar no banco.

### Confirmar fechamento

Chama:

- rpc_criar_fechamento_operacional_5w

Depois:

1. salva fechamento no banco
2. renderiza resultado na tela
3. gera PDF jsPDF automaticamente
4. recarrega historico

### Historico

Chama:

- rpc_listar_fechamentos_operacionais_5w

Permite baixar PDF de fechamentos anteriores.

### WhatsApp

Gera resumo textual com:

- periodo
- responsavel
- protocolo
- saldo final
- movimentos
- auditoria
- assinatura

### PDF jsPDF

O PDF nao usa impressao do navegador.

Conteudo:

- protocolo
- periodo
- responsavel
- assinatura
- observacao
- resumo executivo
- indicadores principais
- movimentacoes por tipo
- saldo final por status
- auditoria
- divergencias, se houver
- assinaturas
- rodape com pagina

## Cache atualizado

index-clean.html carrega:

- clean/fechamento.js?v=1

## Testes executados

### Backend com rollback

Foi executada a criacao de fechamento dentro de transacao com rollback.

Resultado:

- ok = true
- payload completo gerado
- assinatura criada
- saldo final gerado
- resumo de movimentos gerado
- auditoria retornou zero divergencias
- rollback executado

### Confirmacao de nao persistencia

Depois do rollback:

- total_fechamentos = 0

Ou seja, nenhum fechamento real foi salvo durante o teste.

## Roteiro de teste em producao

Abrir:

/index-clean.html?v=5w-fechamento

Testar:

1. Fazer login.
2. Abrir Fechamento.
3. Informar periodo.
4. Informar responsavel.
5. Informar assinatura/documento se quiser.
6. Clicar Gerar previa.
7. Conferir KPIs, movimentos e auditoria.
8. Clicar Baixar PDF jsPDF da previa.
9. Se estiver correto, clicar Confirmar fechamento.
10. Confirmar se PDF foi baixado.
11. Confirmar se o fechamento apareceu no historico.
12. Baixar PDF pelo historico.

## Status

5W concluida.

## Proxima etapa recomendada

5W.1 - Cancelamento controlado de fechamento.

Motivo:

Como fechamento e documento formal, nao deve ser apagado. Se houver erro, o correto e permitir cancelamento justificado, mantendo historico e audit_log.
