# Entrega 5U.8 - Revisao geral dos comprovantes e padronizacao visual

Data: 2026-06-07

## Objetivo

Revisar os comprovantes das movimentacoes criticas e padronizar o minimo operacional entre telas.

## Escopo revisado

Telas com comprovante:

- Operacao rapida
- Lotes de saida
- Saida comum
- Devolucao
- Baixa controlada
- Entrada individual
- Entrada em lote
- Retorno sem cadastro

Tela deixada sem comprovante por decisao operacional:

- Manutencao/teste

## Correcoes aplicadas

### 1. Cache e duplicidade da Baixa

Foi identificado que a Baixa controlada ja tinha comprovante integrado no arquivo principal:

- clean/baixa_equipamento.js

Mas o HTML ainda carregava:

- clean/baixa_equipamento.js?v=1
- clean/comprovante_baixa.js?v=2

Isso criava risco de:

- cache antigo
- botao duplicado
- PDF duplicado
- WhatsApp duplicado
- comportamento diferente entre navegadores

Foi corrigido para:

- clean/baixa_equipamento.js?v=2

E o complemento legado foi removido:

- clean/comprovante_baixa.js

### 2. Index atualizado

index-clean.html agora referencia as versoes atuais:

- clean/operacao_rapida.js?v=4
- clean/lotes_saida.js?v=1
- clean/entrada.js?v=4
- clean/entrada_lote.js?v=4
- clean/retorno_sem_cadastro.js?v=2
- clean/saida_equipamento.js?v=3
- clean/devolucao_equipamento.js?v=3
- clean/baixa_equipamento.js?v=2

## Padrao operacional definido

Toda movimentacao critica com comprovante deve seguir este padrao:

1. Gerar protocolo antes da RPC.
2. Chamar RPC principal.
3. Montar snapshot dos dados confirmados.
4. Salvar snapshot em memoria da tela como ultimoComprovante.
5. Tentar gerar PDF.
6. Copiar texto de WhatsApp.
7. Exibir mensagem final informando sucesso do registro e do comprovante.
8. Manter botao Ultimo comprovante.
9. Nao desfazer a movimentacao se o PDF falhar.
10. Recarregar os dados apos o comprovante ser montado.

## Padrao visual dos PDFs

Os PDFs devem conter:

- LIKE Estoque
- titulo do comprovante
- protocolo
- data/hora
- responsavel/tecnico quando aplicavel
- OS/Referencia quando aplicavel
- motivo/observacao quando aplicavel
- dados do equipamento/material/lote
- MAC/SN quando houver
- status ou destino final quando aplicavel
- linha de assinatura do responsavel
- linha de conferencia/recebedor/auditoria
- rodape com identificacao do sistema

## Padrao de WhatsApp

Os textos de WhatsApp devem conter:

- titulo claro do comprovante
- protocolo
- data/hora
- equipamento/material/lote
- tecnico/responsavel quando aplicavel
- destino/status quando aplicavel
- OS/Referencia quando aplicavel
- frase final de conferencia/registro

## Resultado por tela

### Operacao rapida

Status: aprovado.

Possui:

- PDF
- WhatsApp
- ultimo comprovante
- protocolo
- lote persistido
- historico por protocolo

### Lotes de saida

Status: aprovado.

Possui:

- consulta por protocolo
- PDF do lote
- WhatsApp do lote
- lista de equipamentos
- lista de materiais

### Saida comum

Status: aprovado.

Possui:

- PDF
- WhatsApp
- ultimo comprovante
- protocolo
- snapshot antes da limpeza do formulario

### Devolucao

Status: aprovado.

Possui:

- PDF
- WhatsApp
- ultimo comprovante
- protocolo
- status anterior e final

### Baixa controlada

Status: corrigido e aprovado por inspecao.

Correcoes desta etapa:

- removido complemento legado
- carregamento ajustado para baixa_equipamento.js?v=2
- comprovante fica no arquivo principal

### Entrada individual

Status: aprovado.

Possui:

- PDF
- WhatsApp
- ultimo comprovante
- protocolo
- codigo gerado
- fornecedor/NF/responsavel

### Entrada em lote

Status: aprovado.

Possui:

- PDF consolidado
- WhatsApp consolidado
- ultimo comprovante
- protocolo
- total do lote
- lista de itens criados

### Retorno sem cadastro

Status: aprovado.

Possui:

- PDF
- WhatsApp
- ultimo comprovante
- protocolo
- codigo gerado
- tecnico que devolveu
- condicao/destino

## Teste recomendado

Abrir:

/index-clean.html?v=5u8

Roteiro minimo:

1. Fazer login.
2. Conferir se Baixa carrega sem erro e com botao Ultimo comprovante.
3. Conferir se Entrada carrega com botao Ultimo comprovante.
4. Conferir se Entrada em lote carrega com botao Ultimo comprovante.
5. Conferir se Retorno sem cadastro carrega com botao Ultimo comprovante.
6. Conferir se Saida e Devolucao continuam com botao Ultimo comprovante.
7. Fazer apenas operacoes reais controladas se houver item seguro para teste.
8. Confirmar que PDF baixa e WhatsApp copia.

## Observacao importante

Os PDFs continuam sendo gerados sob demanda no navegador. Eles nao sao salvos no banco.

O banco guarda os dados da movimentacao/historico. O PDF e o texto sao gerados a partir do snapshot da operacao.

## Status

5U.8 concluida.

## Proxima etapa recomendada

5V - Relatorios gerenciais avancados / fechamento operacional.

Motivo:

A camada de comprovantes das movimentacoes criticas esta fechada. O proximo ganho operacional real e consolidar relatorios por estoque, tecnico, status, movimentacoes e divergencias.
