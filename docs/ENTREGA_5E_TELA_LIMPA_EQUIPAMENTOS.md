# Entrega 5E - Tela limpa de Equipamentos

Data: 2026-06-07

## Objetivo

Criar uma tela limpa e paralela de Equipamentos dentro do `index-clean.html`, sem depender dos patches antigos do app principal.

## Arquivo criado

- `clean/equipamentos.js`

## Arquivo atualizado

- `index-clean.html`

## O que a tela faz

- Injeta o menu `Equipamentos` na versão limpa.
- Lista equipamentos carregados do Supabase.
- Filtra por texto e por status.
- Mostra KPIs básicos:
  - total carregado
  - ativos
  - em estoque
  - com técnico
- Permite editar equipamento via `rpc_editar_equipamento_admin`.
- Permite baixar equipamento via `rpc_baixar_equipamento`.
- Permite registrar saída via `rpc_registrar_saida_equipamento`.
- Permite registrar devolução via `rpc_registrar_devolucao_equipamento`.

## O que esta tela NÃO faz

- Não usa `patch27.js`.
- Não usa `patch28.js`.
- Não usa `patch29.js`.
- Não usa `patch30.js`.
- Não usa `final_stable.js`.
- Não edita a tabela `equipamentos` diretamente.
- Não usa `delete` direto.

## RPCs usadas

- `rpc_editar_equipamento_admin`
- `rpc_baixar_equipamento`
- `rpc_registrar_saida_equipamento`
- `rpc_registrar_devolucao_equipamento`

## Como testar

Abrir:

`/index-clean.html?v=5e`

Fluxo recomendado:

1. Fazer login.
2. Abrir menu `Equipamentos`.
3. Clicar em `Recarregar equipamentos`.
4. Testar filtro por código/MAC/modelo.
5. Editar um equipamento ativo.
6. Conferir se movimento/auditoria foram registrados no Supabase.
7. Testar saída em um equipamento ativo.
8. Testar devolução.
9. Testar baixa somente em item de teste ou item correto.

## Observação

A tela ainda usa `prompt()` para edição rápida. A próxima melhoria visual deve substituir os prompts por modal profissional.

## Status

Entrega 5E implementada na rota limpa.
