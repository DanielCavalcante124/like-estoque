# Entrega 5U.7.5 - Comprovante PDF e WhatsApp na Entrada em lote

Data: 2026-06-07

## Objetivo

Adicionar comprovante consolidado na Entrada em lote por bip.

## Motivo

Entrada em lote cria varios patrimonios de uma vez. Se nao houver comprovante consolidado, a conferencia fica fragil e dependente apenas da tela do resultado.

## Arquivos alterados

- clean/entrada_lote.js
- index-clean.html

## Recursos adicionados

### PDF consolidado

Depois de finalizar o lote via RPC, o sistema tenta gerar PDF com:

- LIKE Estoque
- Comprovante de entrada em lote
- protocolo
- data/hora
- tipo/marca/modelo
- local
- total de equipamentos
- custo unitario
- custo total
- fornecedor
- NF/documento
- responsavel
- observacao
- lista de itens recebidos
- linha
- codigo
- MAC/SN
- assinatura do responsavel pela entrada
- assinatura de conferencia/estoque

### Texto WhatsApp consolidado

Depois de finalizar o lote, o sistema copia automaticamente texto com:

- COMPROVANTE DE ENTRADA EM LOTE
- protocolo
- data/hora
- modelo
- local
- total
- custo unitario
- custo total
- fornecedor
- NF/documento
- responsavel
- observacao
- lista dos itens
- frase de entrada registrada e conferida

### Ultimo comprovante

Foi adicionado o botao:

- Ultimo comprovante

Ele copia novamente o ultimo comprovante de entrada em lote gerado na sessao atual.

## Fluxo atualizado

1. Operador seleciona patrimonio unitario.
2. Bipa MAC/SN ou adiciona item sem MAC/SN quando permitido.
3. Monta o pre-cadastro.
4. Finaliza entrada no sistema.
5. Sistema chama rpc_registrar_entrada_equipamento_lote.
6. Sistema normaliza o retorno dos equipamentos criados.
7. Sistema mostra Resultado do ultimo lote.
8. Sistema gera PDF consolidado.
9. Sistema copia comprovante WhatsApp.
10. Sistema limpa pre-cadastro.

## Cache atualizado

index-clean.html agora carrega:

- clean/entrada_lote.js?v=4

## Teste recomendado

Abrir:

/index-clean.html?v=entrada-lote-comprovante

Roteiro:

1. Fazer login.
2. Abrir Entrada em lote.
3. Conferir se aparece o botao Ultimo comprovante.
4. Selecionar patrimonio unitario.
5. Adicionar 2 ou 3 itens ao pre-cadastro.
6. Conferir KPIs do pre-cadastro.
7. Finalizar entrada no sistema somente se for operacao real.
8. Conferir Resultado do ultimo lote.
9. Conferir se PDF consolidado foi baixado.
10. Colar no WhatsApp e conferir o texto consolidado.
11. Clicar Ultimo comprovante e confirmar que copia novamente.
12. Conferir equipamentos criados na lista/historico.

## Status

5U.7.5 concluida.

## Proxima etapa recomendada

5U.7.6 - Comprovante PDF e WhatsApp no Retorno sem cadastro.

Motivo:

Retorno sem cadastro e sensivel porque recebe equipamento que nao estava formalmente cadastrado. Precisa de prova de recebimento e vinculacao posterior.
