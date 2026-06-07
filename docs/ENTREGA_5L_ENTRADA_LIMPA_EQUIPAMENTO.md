# Entrega 5L - Entrada limpa de equipamento

Data: 2026-06-07

## Arquivo criado

- clean/entrada.js

## Arquivo atualizado

- index-clean.html

## Backend usado

- rpc_registrar_entrada_equipamento

## Teste de backend

A RPC foi testada em transacao com rollback como usuario admin.

Resultado esperado confirmado:

- codigo gerado
- status Em estoque
- local Estoque central
- rollback executado

## Recursos da tela

- Menu Entrada na rota limpa.
- Selecao de produto/modelo cadastrado.
- Preenchimento automatico de tipo, marca, modelo e custo.
- Campos MAC e Serial/SN.
- Local de entrada.
- Custo.
- Fornecedor.
- NF/documento.
- Responsavel pela entrada.
- Observacao.
- Preview antes de salvar.
- Validacao: exige tipo, marca, modelo e pelo menos MAC ou Serial.
- Registro via RPC, sem insert direto em equipamentos.
- Lista de ultimos equipamentos recentes.

## Como testar

Abrir:

/index-clean.html?v=5l

1. Fazer login.
2. Abrir menu Entrada.
3. Selecionar produto/modelo.
4. Conferir preenchimento automatico.
5. Informar MAC ou Serial.
6. Informar local, custo, fornecedor/NF se houver.
7. Registrar entrada.
8. Conferir mensagem de codigo gerado.
9. Conferir se aparece na lista de equipamentos recentes.
10. Conferir no dashboard/equipamentos/historico.

## Status

Implementado na rota limpa.
