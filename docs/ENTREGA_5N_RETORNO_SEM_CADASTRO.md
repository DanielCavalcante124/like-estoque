# Entrega 5N - Retorno sem cadastro

Data: 2026-06-07

## Backend criado

- rpc_registrar_retorno_sem_cadastro

## Objetivo

Registrar equipamento antigo que voltou da rua, mas ainda não existia no sistema.

## Diferença para entrada normal

Entrada normal representa compra, NF ou entrada de estoque.

Retorno sem cadastro representa equipamento devolvido pela operação, sem histórico anterior cadastrado.

## Campos gravados

Na tabela equipamentos:

- origem = Retorno sem cadastro
- retorno_sem_cadastro = true
- retorno_data = current_date
- tecnico_devolucao
- condicao_retorno
- motivo_atual = Retorno sem cadastro
- status conforme condição
- local conforme destino

Na tabela movimentos:

- tipo = Retorno sem cadastro
- origem = Retorno sem cadastro
- tecnico
- destino
- motivo = Retorno sem cadastro
- condicao
- status_final
- obs

## Regras de condição

- Bom -> Em estoque / Estoque central
- Testar -> Manutenção
- Defeituoso -> Manutenção
- Sucata/Inutilizar -> Inutilizado

## Frontend criado

- clean/retorno_sem_cadastro.js

## Frontend atualizado

- index-clean.html

## Recursos da tela

- Menu Retorno sem cadastro.
- Seleção de patrimônio unitário.
- Tipo, marca e modelo travados.
- Campos MAC/SN aparecem somente quando o modelo exige.
- Técnico que devolveu.
- Condição do retorno.
- Destino sugerido automaticamente pela condição.
- Custo estimado.
- Responsável pelo lançamento.
- Observação.
- Lista dos últimos retornos sem cadastro.

## Testes de backend

### Patrimônio com MAC/SN obrigatório

Teste em rollback:

- modelo com exige_mac_sn = true
- retorno com MAC/SN
- status final Manutenção
- retorno_sem_cadastro = true

### Patrimônio sem MAC/SN obrigatório

Teste em rollback:

- modelo com exige_mac_sn = false
- retorno sem MAC e sem serial
- status final Em estoque
- local Estoque central
- retorno_sem_cadastro = true

## Como testar

Abrir:

/index-clean.html?v=5n

1. Fazer login.
2. Abrir Retorno sem cadastro.
3. Selecionar patrimônio unitário.
4. Se o modelo exigir MAC/SN, preencher MAC ou SN.
5. Se o modelo não exigir MAC/SN, confirmar que os campos somem.
6. Selecionar técnico que devolveu.
7. Selecionar condição.
8. Conferir destino automático.
9. Registrar retorno.
10. Conferir na lista de últimos retornos.
11. Conferir em Equipamentos e Histórico.

## Status

Implementado na rota limpa.
