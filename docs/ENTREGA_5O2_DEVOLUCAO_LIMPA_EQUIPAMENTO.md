# Entrega 5O.2 - Devolucao limpa de equipamento

Data: 2026-06-07

## Backend validado

RPC usada:

- rpc_registrar_devolucao_equipamento

## Teste de backend

Teste em rollback aprovado:

1. Criou modelo patrimonial unitario.
2. Registrou entrada.
3. Registrou saida para tecnico.
4. Registrou devolucao com condicao Bom.

Resultado:

- status final: Em estoque
- local: Estoque central
- tecnico_atual: null
- rollback executado

## Frontend criado

Arquivo criado:

- clean/devolucao_equipamento.js

## Frontend atualizado

Arquivo atualizado:

- index-clean.html

Script conectado:

- clean/devolucao_equipamento.js?v=1

## Recursos da tela

- Menu Devolucao.
- Lista equipamentos elegiveis para devolucao.
- Busca por codigo, MAC, SN, tecnico, cliente ou OS.
- Seleciona tecnico que devolveu.
- Condicao: Bom, Testar, Defeituoso, Sucata/Inutilizar.
- Destino automatico por condicao.
- OS/Atendimento.
- Motivo.
- Observacao.
- Resumo antes de confirmar.
- Modal profissional de confirmacao.
- Chamada da RPC, sem update direto em equipamentos.

## Equipamentos elegiveis

A tela mostra somente equipamentos com status:

- Com tecnico
- Instalado cliente
- Na rua
- Reservado

## Destino por condicao

- Bom -> Estoque central
- Testar -> Manutencao
- Defeituoso -> Manutencao
- Sucata/Inutilizar -> Inutilizado

## Como testar

Abrir:

/index-clean.html?v=5o2

1. Fazer login.
2. Criar uma saida para tecnico pela tela Saida.
3. Abrir Devolucao.
4. Selecionar o equipamento.
5. Condicao: Bom.
6. Conferir destino Estoque central.
7. Revisar devolucao.
8. Confirmar no modal.
9. Conferir se status voltou para Em estoque.
10. Conferir se saiu da lista de elegiveis.
11. Conferir em Equipamentos e Historico.

## Proximos testes recomendados

- Devolucao Bom.
- Devolucao Testar.
- Devolucao Defeituoso.
- Devolucao Sucata/Inutilizar.
- Devolucao de item instalado cliente.
- Devolucao de item na rua.

## Status

Implementado na rota limpa.
