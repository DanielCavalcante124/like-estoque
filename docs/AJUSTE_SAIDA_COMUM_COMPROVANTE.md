# Ajuste - Comprovante na Saida comum

Data: 2026-06-07

## Motivo

A Operacao rapida ja gerava comprovante PDF e texto para WhatsApp, mas a Saida comum ainda apenas registrava a movimentacao.

Isso criava risco operacional: uma saida individual poderia alterar o estoque sem gerar comprovante imediato para conferencia ou envio ao tecnico.

## Decisao tecnica

Nao foi necessario alterar o banco.

A Saida comum ja usa a RPC:

- rpc_registrar_saida_equipamento

A correcao foi feita no frontend, capturando o protocolo enviado para a RPC e gerando comprovante imediatamente apos a confirmacao.

## Arquivo alterado

- clean/saida_equipamento.js
- index-clean.html

## Recursos adicionados

### PDF da Saida comum

Apos confirmar a saida individual, o sistema tenta gerar PDF com:

- LIKE Estoque
- Comprovante de saida de equipamento
- protocolo
- data/hora
- movimento
- destino
- status final
- tecnico
- cliente/local
- OS/Referencia
- motivo
- observacao
- codigo
- patrimonio
- modelo
- MAC/SN
- campo de assinatura do responsavel pela entrega
- campo de assinatura do recebedor/conferencia

### Texto WhatsApp

Apos confirmar a saida individual, o sistema copia automaticamente um comprovante de texto com:

- COMPROVANTE DE SAIDA DE EQUIPAMENTO
- protocolo
- data/hora
- movimento
- destino
- tecnico
- cliente/local
- OS/Referencia
- motivo
- observacao
- equipamento
- status final
- frase de recebimento/conferencia

### Ultimo comprovante

Foi adicionado o botao:

- Ultimo comprovante

Ele copia novamente para WhatsApp o ultimo comprovante gerado na sessao atual.

## Cache atualizado

index-clean.html agora carrega:

- clean/saida_equipamento.js?v=3

## Teste recomendado

Abrir:

/index-clean.html?v=saida-comprovante

Roteiro:

1. Fazer login.
2. Abrir Saida.
3. Selecionar um equipamento disponivel.
4. Selecionar tipo de saida.
5. Preencher tecnico, OS, destino e observacao conforme o tipo.
6. Clicar Revisar saida.
7. Confirmar somente se for operacao real.
8. Conferir se o PDF foi baixado.
9. Colar no WhatsApp e conferir o texto copiado.
10. Clicar Ultimo comprovante e conferir se copia novamente.
11. Conferir Historico do equipamento.

## Status

Ajuste concluido.

## Observacao

Se o PDF falhar por bloqueio do navegador, a saida nao deve ser desfeita. O texto WhatsApp ainda e copiado ou exibido em prompt para copia manual.
