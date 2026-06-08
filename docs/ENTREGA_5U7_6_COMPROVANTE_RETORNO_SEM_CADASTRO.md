# Entrega 5U.7.6 - Comprovante PDF e WhatsApp no Retorno sem cadastro

Data: 2026-06-07

## Objetivo

Adicionar comprovante operacional no Retorno sem cadastro.

## Motivo

Retorno sem cadastro recebe equipamento antigo/externo que ainda nao estava formalmente cadastrado no sistema. E uma movimentacao sensivel porque cria um patrimonio e regulariza um retorno ao mesmo tempo.

## Arquivos alterados

- clean/retorno_sem_cadastro.js
- index-clean.html

## Recursos adicionados

### PDF

Depois de registrar o retorno via RPC, o sistema tenta gerar PDF com:

- LIKE Estoque
- Comprovante de retorno sem cadastro
- protocolo
- data/hora
- codigo gerado
- status
- destino
- tecnico que devolveu
- condicao
- responsavel
- custo estimado
- observacao
- modelo recebido
- MAC/SN
- assinatura do responsavel pelo recebimento
- assinatura de conferencia/regularizacao

### Texto WhatsApp

Depois de registrar o retorno, o sistema copia automaticamente texto com:

- COMPROVANTE DE RETORNO SEM CADASTRO
- protocolo
- data/hora
- codigo gerado
- equipamento
- MAC/SN
- tecnico que devolveu
- condicao
- destino
- custo estimado
- responsavel
- observacao
- frase de retorno registrado e conferido

### Ultimo comprovante

Foi adicionado o botao:

- Ultimo comprovante

Ele copia novamente o ultimo comprovante de retorno sem cadastro gerado na sessao atual.

## Fluxo atualizado

1. Operador abre Retorno sem cadastro.
2. Seleciona patrimonio unitario.
3. Informa MAC/SN se obrigatorio.
4. Informa tecnico que devolveu, condicao, destino, custo, responsavel e observacao.
5. Clica Registrar retorno.
6. Sistema chama rpc_registrar_retorno_sem_cadastro.
7. Sistema gera PDF.
8. Sistema copia comprovante WhatsApp.
9. Sistema limpa formulario e recarrega a lista.

## Cache atualizado

index-clean.html agora carrega:

- clean/retorno_sem_cadastro.js?v=2

## Teste recomendado

Abrir:

/index-clean.html?v=retorno-sem-cadastro-comprovante

Roteiro:

1. Fazer login.
2. Abrir Retorno sem cadastro.
3. Conferir se aparece o botao Ultimo comprovante.
4. Selecionar patrimonio unitario.
5. Preencher MAC/SN quando obrigatorio.
6. Selecionar tecnico que devolveu.
7. Escolher condicao e conferir destino automatico.
8. Preencher responsavel e observacao.
9. Clicar Registrar retorno somente se for operacao real.
10. Conferir se o PDF foi baixado.
11. Colar no WhatsApp e conferir o texto.
12. Clicar Ultimo comprovante e confirmar que copia novamente.
13. Conferir se o retorno aparece em Ultimos retornos sem cadastro.
14. Conferir Historico do equipamento.

## Status

5U.7.6 concluida.

## Proxima etapa recomendada

5U.8 - Revisao geral dos comprovantes e padronizacao visual.

Motivo:

Agora as movimentacoes criticas ja possuem comprovantes. O proximo passo e revisar consistencia, cache, linguagem dos PDFs, botoes e mensagens para evitar divergencia entre telas.
