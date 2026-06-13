# UI - Confirmar instalação com MAC e SN separados

Data: 2026-06-13

## Objetivo

Separar MAC e SN na tela de Confirmar instalação.

## Problema

A tela principal de Equipamentos já tinha sido ajustada, mas a tela Confirmar instalação possuía tabela própria e resumo próprio ainda exibindo MAC/SN junto.

## Alteração aplicada

Arquivo alterado:

```text
clean/confirmar_instalacao.js
```

## Resultado

Tabela de equipamentos em aberto:

```text
MAC em coluna própria
SN em coluna própria
```

Resumo antes de confirmar:

```text
MAC: valor
SN: valor
```

## Ajustes técnicos

```text
Cabeçalho MAC/SN trocado por MAC e SN
Célula única e.mac || e.serial removida
Renderização usa e.mac e e.serial separadamente
Colspan da tabela vazia ajustado para 8
```

## Cache-bust

Arquivo alterado:

```text
index-clean.html
```

Atualizado:

```text
clean/confirmar_instalacao.js?v=3
```

## Preservado

```text
Sem alteração de banco
Sem alteração de RPC
Sem alteração de regra de negócio
Sem alteração de permissões
Sem alteração no fluxo de confirmação
Sem alteração na idempotência
```

## Validação

Confirmado no código:

```text
Cabeçalho tem MAC e SN separados
Resumo mostra MAC e SN separados
Tabela usa e.mac e e.serial separadamente
index-clean.html carrega confirmar_instalacao.js v3
```

## Acerto registrado

A correção foi feita na tela oficial, sem arquivo paralelo e sem gambiarra.
