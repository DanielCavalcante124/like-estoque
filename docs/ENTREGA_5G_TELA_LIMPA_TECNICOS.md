# Entrega 5G - Tela limpa de Técnicos

Data: 2026-06-07

## Objetivo

Criar uma tela limpa e paralela de Técnicos dentro do `index-clean.html`, sem depender dos patches antigos do app principal.

## Arquivo criado

- `clean/tecnicos.js`

## Arquivo atualizado

- `index-clean.html`

## O que a tela faz

- Injeta o menu `Técnicos` na versão limpa.
- Carrega técnicos ativos.
- Cruza dados de equipamentos em posse.
- Cruza dados de materiais em posse.
- Calcula valor estimado de patrimônio por técnico.
- Mostra pendências básicas.
- Mostra histórico recente de movimentos de equipamentos e materiais.
- Gera resumo copiável para cobrança/conferência operacional.

## Dados usados

- `tecnicos`
- `equipamentos`
- `materiais_saldos`
- `movimentos`
- `materiais_movimentos`

## O que esta tela NÃO faz

- Não usa `patch27.js`.
- Não usa `patch28.js`.
- Não usa `patch29.js`.
- Não usa `patch30.js`.
- Não usa `final_stable.js`.
- Não altera dados.
- Não faz delete.
- Não usa funções antigas do app principal.

## Como testar

Abrir:

`/index-clean.html?v=5g`

Fluxo recomendado:

1. Fazer login.
2. Abrir menu `Técnicos`.
3. Clicar em `Recarregar técnicos`.
4. Selecionar um técnico.
5. Conferir equipamentos em posse.
6. Conferir materiais em posse.
7. Conferir pendências.
8. Conferir histórico recente.
9. Clicar em `Copiar resumo`.
10. Colar em uma conversa/teste para validar o texto.

## Status

Entrega 5G implementada na rota limpa.
