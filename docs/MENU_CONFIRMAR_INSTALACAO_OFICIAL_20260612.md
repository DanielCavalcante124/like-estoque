# Menu oficial - Confirmar instalação

Data: 2026-06-12

## Objetivo

Remover o fix externo `clean/menu_operacao_fix.js` e incorporar a tela **Confirmar instalação** ao menu oficial de permissões em `clean/permissoes.js`.

## Problema anterior

A tela `Confirmar instalação` criava o botão:

```text
navConfirmarInstalacao
```

Mas esse ID não existia no menu oficial de permissões/grupos.

Como consequência, foi criado um fix externo:

```text
clean/menu_operacao_fix.js
```

Esse fix movia o botão para o grupo Operação depois do carregamento.

## Correção aplicada

### Arquivo oficial alterado

```text
clean/permissoes.js
```

Incluído em `NAV_RULES`:

```text
#navConfirmarInstalacao -> operacao_estoque
```

Incluído no grupo `Operação` em `CATEGORIES`:

```text
navConfirmarInstalacao
confirmar instalação
confirmar instalacao
```

### HTML alterado

```text
index-clean.html
```

Alterado cache-bust:

```text
clean/permissoes.js?v=6
```

Removido carregamento:

```text
clean/menu_operacao_fix.js?v=1
```

### Arquivo removido

```text
clean/menu_operacao_fix.js
```

## Segurança e banco de dados

Nenhuma alteração de banco foi feita.

Nenhuma RPC foi alterada.

A permissão usada continua sendo:

```text
operacao_estoque
```

## Validação recomendada

Após Ctrl+F5:

```text
1. Login com usuário que tenha permissão de operação.
2. Abrir menu lateral.
3. Confirmar que "Confirmar instalação" aparece em Operação.
4. Confirmar que não aparece em Outros.
5. Abrir a tela Confirmar instalação.
6. Confirmar que usuários sem permissão operacional não visualizam a tela.
```

## Risco

```text
Baixo.
Alteração de organização de menu e permissão frontend.
Sem alteração de regra de negócio, banco ou RPC.
```
