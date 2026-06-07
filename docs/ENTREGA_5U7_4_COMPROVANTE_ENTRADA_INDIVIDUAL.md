# Entrega 5U.7.4 - Comprovante PDF e WhatsApp na Entrada individual

Data: 2026-06-07

## Objetivo

Adicionar comprovante operacional na Entrada individual de equipamento patrimonial.

## Motivo

Entrada individual aumenta o estoque e precisa gerar prova de recebimento/conferencia.

## Arquivos alterados

- clean/entrada.js
- index-clean.html

## Recursos adicionados

### PDF da entrada individual

Depois de registrar a entrada via RPC, o sistema tenta gerar PDF com:

- LIKE Estoque
- Comprovante de entrada de equipamento
- protocolo
- data/hora
- codigo gerado
- status
- local
- fornecedor
- NF/documento
- responsavel
- custo
- observacao
- modelo recebido
- MAC/SN
- patrimonio/codigo
- campo de assinatura do responsavel pela entrada
- campo de conferencia/estoque

### Texto WhatsApp

Depois de registrar a entrada, o sistema copia automaticamente um texto com:

- COMPROVANTE DE ENTRADA DE EQUIPAMENTO
- protocolo
- data/hora
- codigo
- equipamento
- MAC/SN
- local
- custo
- fornecedor
- NF/documento
- responsavel
- observacao
- frase de entrada registrada e conferida

### Ultimo comprovante

Foi adicionado o botao:

- Ultimo comprovante

Ele copia novamente o ultimo comprovante de entrada gerado na sessao atual.

## Fluxo atualizado

1. Operador abre Entrada.
2. Seleciona patrimonio unitario.
3. Preenche MAC/SN quando obrigatorio.
4. Escolhe local.
5. Informa custo, fornecedor, NF, responsavel e observacao.
6. Clica Registrar entrada.
7. Sistema chama rpc_registrar_entrada_equipamento.
8. Sistema gera PDF.
9. Sistema copia comprovante WhatsApp.
10. Sistema limpa formulario e recarrega lista.

## Cache atualizado

index-clean.html agora carrega:

- clean/entrada.js?v=4

## Teste recomendado

Abrir:

/index-clean.html?v=entrada-comprovante

Roteiro:

1. Fazer login.
2. Abrir Entrada.
3. Conferir se aparece o botao Ultimo comprovante.
4. Selecionar patrimonio unitario.
5. Preencher MAC/SN se o modelo exigir.
6. Preencher fornecedor, NF, responsavel e observacao.
7. Clicar Registrar entrada.
8. Conferir se o PDF foi baixado.
9. Colar no WhatsApp e conferir o texto copiado.
10. Clicar Ultimo comprovante e confirmar que copia novamente.
11. Conferir se o equipamento aparece na lista de entradas recentes.
12. Conferir Historico do equipamento.

## Status

5U.7.4 concluida.

## Proxima etapa recomendada

5U.7.5 - Comprovante PDF e WhatsApp na Entrada em lote.

Motivo:

Entrada em lote e mais sensivel que a individual porque cria varios patrimonios de uma vez. Precisa de comprovante consolidado do lote recebido.
