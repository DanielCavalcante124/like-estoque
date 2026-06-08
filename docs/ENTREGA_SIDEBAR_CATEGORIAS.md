# Entrega - Sidebar por categorias

Data: 2026-06-08

## Objetivo

Organizar a sidebar em grupos para reduzir excesso de abas soltas e melhorar a navegação.

## Arquivo alterado

- clean/permissoes.js

## Categorias

- Principal
- Operação
- Patrimônio
- Materiais
- Cadastros
- Gestão
- Administração
- Outros

## Ordem operacional

### Principal

- Dashboard

### Operação

- Operação rápida
- Entrada
- Entrada em lote
- Saída
- Saída em lote
- Devolução
- Retorno sem cadastro

### Patrimônio

- Equipamentos
- Histórico
- Manutenção
- Baixa

### Materiais

- Materiais

### Cadastros

- Cadastros
- Técnicos

### Gestão

- Relatórios
- Auditoria
- Fechamento
- Impacto fechamento
- Análise operacional

### Administração

- Usuários
- Teste perfis
- Backup
- Produção

## Comportamento

- Categorias são recolhíveis.
- Principal e Operação começam abertas.
- Ao abrir uma tela, a categoria dela abre automaticamente.
- Menus sem permissão continuam ocultos.
- Grupos sem itens visíveis ficam ocultos.
- O estado aberto/fechado é salvo no navegador.

## Cache

index-clean.html agora carrega:

- clean/permissoes.js?v=3

## Teste

Abrir:

- /index-clean.html?v=sidebar-categorias-v3
- /index-6g.html

## Status

Concluído.
