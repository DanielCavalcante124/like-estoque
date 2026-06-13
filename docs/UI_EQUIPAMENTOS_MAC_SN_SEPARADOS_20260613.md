# UI - Equipamentos com MAC e SN separados

Data: 2026-06-13

## Objetivo

Melhorar a visualização da tela de Equipamentos/Patrimônio separando as informações de MAC e SN em colunas próprias.

## Alteração aplicada

Arquivo alterado:

```text
clean/equipamentos.js
```

Antes:

```text
MAC/SN em uma única coluna
```

Depois:

```text
MAC em coluna própria
SN em coluna própria
```

## Ajustes técnicos

Cabeçalho da tabela:

```text
MAC
SN
```

Renderização das linhas:

```text
e.mac separado de e.serial
```

Estado vazio ajustado para o novo total de colunas:

```text
colspan = 10
```

## Cache-bust

Arquivo alterado:

```text
index-clean.html
```

Atualizado:

```text
clean/equipamentos.js?v=7
```

## Preservado

```text
Sem alteração de banco
Sem alteração de RPC
Sem alteração de regra de negócio
Sem alteração de permissões
Sem alteração de busca paginada
Sem alteração nos fluxos de Saída, Devolução, Manutenção, Baixa e Histórico
```

## Validação

Confirmado em código:

```text
Cabeçalho MAC e SN separados
Célula MAC usa e.mac
Célula SN usa e.serial
Tabela vazia usa colspan 10
index-clean.html carrega equipamentos.js?v=7
```

## Acerto registrado

A melhoria foi feita na tela oficial, sem arquivo paralelo e sem gambiarra.

## Teste recomendado

Abrir a tela Equipamentos e validar:

```text
MAC aparece em coluna própria
SN aparece em coluna própria
Ações continuam funcionando
Paginação continua funcionando
Busca continua funcionando
```
