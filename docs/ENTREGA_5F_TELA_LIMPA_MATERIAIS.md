# Entrega 5F - Tela limpa de Materiais

Data: 2026-06-07

## Objetivo

Criar uma tela limpa e paralela de Materiais dentro do `index-clean.html`, sem depender dos patches antigos do app principal.

## Arquivo criado

- `clean/materiais.js`

## Arquivo atualizado

- `index-clean.html`

## O que a tela faz

- Injeta o menu `Materiais` na versão limpa.
- Lista materiais cadastrados a partir dos modelos classificados como material/consumo/material fechado.
- Lista saldos de `materiais_saldos`.
- Lista histórico recente de `materiais_movimentos`.
- Permite entrada de material via RPC.
- Permite saída para técnico via RPC.
- Permite baixa por uso via RPC.
- Mostra KPIs básicos:
  - materiais cadastrados
  - linhas de saldo
  - quantidade total
  - saldos com técnicos

## O que esta tela NÃO faz

- Não usa `patch27.js`.
- Não usa `patch28.js`.
- Não usa `patch29.js`.
- Não usa `patch30.js`.
- Não usa `final_stable.js`.
- Não atualiza `materiais_saldos` diretamente.
- Não insere em `materiais_movimentos` diretamente.

## RPCs usadas

- `rpc_entrada_material`
- `rpc_saida_material_tecnico`
- `rpc_consumo_material_tecnico`

## Como testar

Abrir:

`/index-clean.html?v=5f`

Fluxo recomendado:

1. Fazer login.
2. Abrir menu `Materiais`.
3. Clicar em `Recarregar materiais`.
4. Conferir saldos.
5. Registrar entrada de material.
6. Registrar saída para técnico.
7. Registrar baixa por uso.
8. Conferir se o saldo e o histórico foram atualizados.

## Observação

A tela ainda usa formulários simples. A próxima melhoria visual será aplicar modal/ficha profissional e validações mais detalhadas por produto.

## Status

Entrega 5F implementada na rota limpa.
