# Entrega 7A.2 - Melhorar UX mobile dos fluxos mais usados

Data: 2026-06-08

## Objetivo

Melhorar a experiência de uso do LIKE Estoque em celular/tablet sem alterar regras de negócio, RPCs, RLS, permissões ou fluxo operacional da versão estável 6G.

A 7A.2 é uma melhoria visual/UX global.

## Arquivo alterado

- clean/styles.css

## Estratégia

Foi aplicada uma camada CSS mobile-first diretamente no stylesheet principal.

Motivo:

- melhora todas as telas de uma vez
- não mexe no banco operacional
- não altera JavaScript crítico
- não altera permissões
- preserva a estabilidade da versão 6G

## Melhorias aplicadas

### Área de toque

Campos e botões receberam altura mínima melhor para celular:

- botões
- menus
- inputs
- selects
- textareas

Objetivo:

- reduzir toque errado
- facilitar uso em campo
- melhorar usabilidade no Android/iPhone

### Menu mobile

Melhorias:

- sidebar sticky no topo
- navegação horizontal com scroll
- item ativo mais destacado
- scroll snap aproximado
- menor consumo de altura na tela

Objetivo:

- facilitar troca de telas no celular
- evitar perder o menu ao rolar

### Topbar mobile

Melhorias:

- topbar sticky abaixo do menu
- botões organizados em grade
- título mais compacto
- descrição limitada em telas pequenas

Objetivo:

- manter contexto da tela visível
- reduzir poluição visual

### Formulários

Melhorias:

- inputs com 16px no mobile para evitar zoom automático do iOS
- campos mais altos
- bordas mais arredondadas
- melhor espaçamento
- botões maiores e em coluna quando necessário

Objetivo:

- melhorar preenchimento de entrada, saída, manutenção, técnicos e cadastros

### Tabelas

Melhorias:

- scrollbar mais visível
- dica visual: "Arraste a tabela para o lado"
- sombra lateral indicando rolagem horizontal
- cabeçalho sticky dentro da tabela
- colunas mais compactas em mobile

Objetivo:

- reduzir confusão em tabelas grandes
- facilitar leitura em celular

### Cards e KPIs

Melhorias:

- cards mais compactos
- KPIs mais legíveis
- melhor quebra de grid em telas pequenas
- itens da lista em formato mais adequado ao toque

Objetivo:

- melhorar leitura operacional rápida

### Safe area

Adicionado suporte a:

- env(safe-area-inset-bottom)

Objetivo:

- evitar que conteúdo fique escondido atrás da barra inferior em iPhone/Android

## Não alterado

A 7A.2 não alterou:

- banco de dados operacional
- RPCs de movimentação
- RLS
- permissões por perfil
- regras de fechamento
- backup
- auditoria
- lógica de estoque

## Backlog

O item 7A.2 foi marcado como:

- concluida

Prioridade original:

- alta

## Como testar

Abrir no celular:

/index-6g.html

Ou diretamente:

/index-clean.html?v=7a2-mobile

Se o navegador estiver com CSS antigo em cache:

- recarregar forçado
- abrir em guia anônima
- limpar cache do navegador

## Testes recomendados

### Celular pequeno

1. Login como operador.
2. Abrir Operação rápida.
3. Abrir Entrada.
4. Abrir Saída.
5. Conferir botões e campos.
6. Conferir se menu superior rola horizontalmente.

### Gestor

1. Login como gestor.
2. Abrir Técnicos.
3. Abrir Relatórios.
4. Abrir Fechamento.
5. Conferir tabelas horizontais.

### Técnico

1. Login como técnico.
2. Confirmar que menus proibidos continuam ocultos.
3. Confirmar que telas permitidas ficaram mais fáceis de usar.

## Critério de aceite

A melhoria é considerada aprovada se:

- menus continuam respeitando perfil
- botões não ficam espremidos
- campos não geram zoom no iPhone
- tabelas mostram dica de arrastar
- não houve alteração de dados/regra de negócio
- desktop continua funcional

## Status

7A.2 concluída.

## Próxima etapa recomendada

7A.1 - Painel de backlog/melhorias no frontend.

Motivo:

- agora o backlog já existe no banco
- falta uma tela visual para admin/gestor acompanhar status, prioridade e próximos passos
