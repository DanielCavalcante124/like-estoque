# Entrega 5O.1 - Saida limpa de equipamento

Data: 2026-06-07

## Backend validado

RPC usada:

- rpc_registrar_saida_equipamento

A RPC:

- exige permissao operacional pelo app_assert_can_operate_stock
- atualiza status/local/tecnico/cliente/OS/motivo
- registra movimento
- registra audit_log
- usa client_operation_id para idempotencia

## Ajuste de backend aplicado

A RPC core foi ajustada para reconhecer tambem:

- Enviar para manutencao -> status Manutencao

E bloquear saida de equipamentos com status:

- Inutilizado
- Perdido
- Baixado
- Manutencao
- Em manutencao
- Com tecnico
- Instalado cliente
- Na rua

## Teste de backend

Teste em rollback de saida para tecnico aprovado:

- status final: Com tecnico
- local: tecnico informado
- tecnico_atual: tecnico informado
- rollback executado

## Frontend criado

Arquivo criado:

- clean/saida_equipamento.js

## Frontend atualizado

Arquivo atualizado:

- index-clean.html

Script conectado:

- clean/saida_equipamento.js?v=1

## Recursos da tela

- Menu Saida.
- Lista equipamentos disponiveis.
- Busca por codigo, MAC, SN, modelo ou local.
- Filtro de equipamentos aptos para saida.
- Saida para tecnico.
- Instalacao cliente.
- Enviar para rua.
- Reservar para OS.
- Enviar para manutencao.
- Validacao por tipo de saida.
- Resumo antes de confirmar.
- Modal profissional de confirmacao.
- Chamada da RPC, sem update direto na tabela equipamentos.

## Validacoes da tela

Enviar para tecnico:

- exige tecnico

Instalacao cliente:

- exige tecnico
- exige cliente/endereco
- exige OS/atendimento

Enviar para rua:

- exige tecnico responsavel

Reservar para OS:

- exige OS

Enviar para manutencao:

- destino padrao Manutencao

## Como testar

Abrir:

/index-clean.html?v=5o1

1. Fazer login.
2. Abrir Saida.
3. Selecionar equipamento disponivel.
4. Escolher Enviar para tecnico.
5. Selecionar tecnico.
6. Revisar saida.
7. Confirmar no modal.
8. Conferir se status virou Com tecnico.
9. Conferir se o equipamento saiu da lista de disponiveis.
10. Conferir em Equipamentos e Historico.

## Proximos testes recomendados

- Saida para tecnico.
- Instalacao cliente.
- Enviar para rua.
- Reservar para OS.
- Enviar para manutencao.

## Status

Implementado na rota limpa.
