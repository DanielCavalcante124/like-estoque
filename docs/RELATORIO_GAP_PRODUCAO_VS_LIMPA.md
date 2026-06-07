# Relatorio - Gap entre versao em producao e versao limpa

Data: 2026-06-07

## Objetivo

Comparar a versao atual em producao, baseada em index.html e patches, com a versao limpa index-clean.html.

## Conclusao executiva

A versao limpa ja cobre os fluxos criticos principais com arquitetura melhor e mais segura, mas ainda nao substitui 100% a operacao diaria da versao em producao.

O maior ponto faltante para operacao real e:

- Operacao rapida com bipagem universal e carrinho

O segundo ponto faltante e:

- Central de relatorios gerenciais em blocos, como existe na producao

## O que a versao limpa ja cobre bem

- Login melhorado
- Dashboard operacional
- Cadastros de produto/modelo, tecnico e local
- Entrada individual
- Entrada em lote patrimonial
- Retorno sem cadastro
- Saida de equipamento
- Devolucao
- Manutencao/teste
- Baixa controlada
- Historico completo por equipamento
- PDF de movimentacoes do equipamento
- Materiais: entrada, saida para tecnico e baixa por uso
- Tecnicos: equipamentos, materiais, pendencias e historico recente
- Relatorios basicos
- Responsividade base
- Status e filtros padronizados
- Integracao da tela Equipamentos com fluxos padronizados

## Principais lacunas encontradas

### 1. Operacao rapida / bipagem universal

A versao em producao possui Operacao rapida com:

- busca universal por MAC, SN, codigo, patrimonio, tecnico, cliente, OS, modelo ou material
- carrinho de saida para tecnico
- bipagem de varios equipamentos
- materiais no mesmo carrinho
- copiar mensagem para WhatsApp
- alertas criticos
- atalhos operacionais

A versao limpa ainda nao possui modulo equivalente.

Impacto: ALTO.

Sem isso, a operacao diaria fica mais lenta, principalmente quando a rotina usa bipagem.

### 2. Saida em carrinho/lote

A producao possui saida em carrinho para varios equipamentos.

A versao limpa possui saida individual de equipamento, mas nao possui saida em carrinho/lote com varios equipamentos e mensagem de conferencia.

Impacto: ALTO.

### 3. Relatorios gerenciais em blocos

A producao possui uma central de relatorios com blocos:

- Operacao diaria
- Tecnicos
- Materiais
- Clientes/campo
- Auditoria, compras e inteligencia

A versao limpa possui relatorios mais seguros e simples, mas ainda nao tem a mesma abrangencia gerencial.

Impacto: MEDIO/ALTO.

### 4. Fechamento para WhatsApp

A producao possui relatorio/mensagem de fechamento diario para WhatsApp e cobranca por tecnico.

A versao limpa ainda nao replica essas mensagens prontas.

Impacto: MEDIO.

### 5. Estoque central como tela operacional propria

A producao possui uma tela separada de Estoque central.

Na versao limpa, isso ficou absorvido em Equipamentos, Dashboard e Relatorios.

Impacto: MEDIO.

Nao e necessariamente erro, mas pode afetar o costume operacional.

### 6. Estoque por tecnico como tela separada

A producao possui Estoque por tecnico e Tecnicos como areas separadas.

A versao limpa consolidou muita coisa na tela Tecnicos.

Impacto: MEDIO.

Funcionalmente existe boa parte, mas a experiencia visual pode nao ser igual a producao.

### 7. Instalacao cliente / retorno cliente

A producao tem atalhos dentro da Operacao rapida para instalar no cliente, devolver, manutencao e historico a partir do item encontrado.

A versao limpa possui Saida, Devolucao e Historico, mas ainda nao possui um fluxo rapido unico a partir da busca universal.

Impacto: ALTO para operacao de campo.

### 8. Sugestao de compra e inteligencia operacional

A producao possui relatorios de estoque minimo, sugestao de compra, perdas e inteligencia.

A versao limpa possui alertas no dashboard e relatorios basicos, mas ainda nao possui uma area completa de inteligencia.

Impacto: MEDIO.

## Riscos da versao em producao que a limpa ja melhorou

A versao em producao ainda depende de muitos patches:

- patch27
- patch28
- patch29
- patch30
- patch31
- patch32
- patch33
- patch36
- final_stable
- cadastros_rpc_guard

Isso aumenta risco de conflito, ordem de carregamento e bug dificil de rastrear.

A versao limpa melhorou isso usando modulos separados em clean/ e RPCs mais controladas.

## Risco tecnico importante na producao

Alguns fluxos de carrinho/operacao rapida da producao fazem update direto no frontend em equipamentos e materiais.

Isso funciona, mas e inferior ao padrao novo da versao limpa, que usa RPC para operacoes criticas.

Antes de migrar Operacao rapida, a decisao correta e recriar o carrinho usando RPCs, nao copiar o codigo antigo diretamente.

## Prioridade recomendada

### Fase 5U - Operacao rapida limpa

Criar tela nova:

- clean/operacao_rapida.js

Recursos:

- busca universal
- bipagem por MAC/SN/codigo/patrimonio
- resultado com status e acoes corretas
- carrinho de equipamentos
- carrinho de materiais
- selecionar tecnico
- confirmar saida em lote por RPC
- copiar WhatsApp
- bloquear item indisponivel
- abrir Historico, Devolucao, Manutencao e Baixa pelo item

Prioridade: CRITICA.

### Fase 5V - Saida em lote por RPC

Criar RPC propria para saida em lote de equipamentos e materiais.

Prioridade: CRITICA.

### Fase 5W - Relatorios gerenciais avancados

Migrar os blocos principais da producao:

- Resumo do dia
- Fechamento WhatsApp
- Estoque por tecnico
- Pendencias por tecnico
- Ranking de posse
- Cobranca WhatsApp
- Saldo de materiais
- Materiais consumidos
- Estoque minimo / sugestao de compra
- Instalados em cliente
- Patrimonio em campo
- Baixas/descarte
- Manutencao/parados
- Entrada por NF
- Inteligencia operacional

Prioridade: ALTA.

### Fase 5X - Tela Estoque central e Estoque por tecnico dedicadas

Decidir se essas telas continuam separadas ou se ficam consolidadas em Equipamentos/Tecnicos.

Prioridade: MEDIA.

## Melhor decisao objetiva

Antes da versao Windows, nao iniciar empacotamento ainda.

A proxima etapa correta e:

- 5U - Operacao rapida limpa com bipagem e carrinho

Motivo:

Essa e a maior diferenca operacional entre a producao e a versao limpa.

Se a empresa usa bipagem e saida em lote no dia a dia, transformar a versao limpa em Windows antes disso vai gerar retrabalho e reclamacao operacional.
