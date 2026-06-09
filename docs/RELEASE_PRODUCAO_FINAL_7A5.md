# Release - Produção final 7A.5

## Status

Projeto publicado como versão principal do app.

## Entrada oficial

O arquivo `index.html` foi alterado para redirecionar para:

```txt
index-clean.html?v=producao-final-7a5-3
```

O arquivo `index-6g.html` também foi atualizado como lançador auxiliar.

## Escopo publicado

Inclui:

- login restrito
- dashboard
- cadastros
- equipamentos
- materiais
- técnicos
- relatórios
- auditoria
- fechamento operacional
- impacto de fechamento
- análise operacional
- produção/admin
- backup
- usuários/perfis
- backlog de melhorias
- inventário por bipagem
- relatório de inventário
- correção guiada de divergências
- termo de fechamento de inventário

## Testes prévios executados

- Revisão 6G aprovada
- Healthcheck aprovado
- Matriz de perfis aprovada
- Admin e gestor com acesso ao inventário
- Operador e técnico bloqueados corretamente em inventário sensível
- Teste de bipagem em rollback aprovado
- Teste do termo em rollback aprovado após correção do hash

## Observação

Release liberada como produção assistida. Recomenda-se acompanhar os primeiros lançamentos reais e revisar logs/auditoria após o primeiro ciclo de uso.
