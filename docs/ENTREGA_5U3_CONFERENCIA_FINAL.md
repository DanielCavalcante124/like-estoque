# Entrega 5U.3 - Conferencia final antes da saida em lote

Data: 2026-06-07

## Objetivo

Adicionar uma etapa obrigatoria de conferencia antes de gravar uma saida em lote pela Operacao rapida.

## Problema resolvido

Antes, o botao Confirmar saida chamava a RPC diretamente.

Isso funcionava, mas aumentava risco humano em operacao real:

- tecnico errado
- OS esquecida
- material com quantidade errada
- equipamento errado no carrinho
- confirmacao acidental

## Arquivo alterado

- clean/operacao_rapida.js
- index-clean.html

## O que foi criado

Modal de conferencia final com:

- tecnico selecionado
- OS/Referencia
- total de equipamentos
- total de materiais
- lista de equipamentos
- codigo do equipamento
- modelo do equipamento
- MAC/SN
- status atual
- lista de materiais
- quantidade de cada material
- saldo atual do material
- observacao da saida
- aviso quando OS nao for informada

## Novo fluxo

1. Operador monta o carrinho.
2. Operador seleciona tecnico.
3. Operador informa OS/Referencia e observacao, se necessario.
4. Operador clica em Conferir e confirmar.
5. Sistema abre o modal de conferencia.
6. Operador revisa os dados.
7. Operador pode Voltar e corrigir.
8. Operador clica em Confirmar definitivamente.
9. Sistema chama rpc_operacao_rapida_saida_lote.
10. Sistema copia mensagem WhatsApp e limpa carrinho.

## Protecoes mantidas

- carrinho vazio bloqueado
- tecnico obrigatorio
- equipamento indisponivel bloqueado
- material sem modelo_id bloqueado
- material fora do estoque central bloqueado
- saldo insuficiente bloqueado
- clique duplo bloqueado durante confirmacao

## Cache atualizado

index-clean.html agora carrega:

- clean/operacao_rapida.js?v=3

## Teste recomendado

Abrir:

/index-clean.html?v=5u3

Roteiro:

1. Fazer login.
2. Abrir Operacao rapida.
3. Buscar equipamento Em estoque.
4. Adicionar ao carrinho.
5. Buscar material com saldo central.
6. Informar quantidade.
7. Adicionar material.
8. Selecionar tecnico.
9. Deixar OS vazia e clicar Conferir e confirmar.
10. Conferir se aparece aviso de OS nao informada.
11. Clicar Voltar e corrigir.
12. Informar OS.
13. Clicar Conferir e confirmar novamente.
14. Conferir equipamentos e materiais no modal.
15. Clicar Confirmar definitivamente apenas se for operacao real.
16. Conferir Historico e Tecnicos depois da saida.

## Status

5U.3 concluida.

## Proxima etapa recomendada

5U.4 - Comprovante/PDF da saida em lote.

Motivo:

Depois da conferencia final, o proximo ganho operacional e gerar comprovante da saida em lote com tecnico, OS, equipamentos, materiais e assinatura/conferencia.
