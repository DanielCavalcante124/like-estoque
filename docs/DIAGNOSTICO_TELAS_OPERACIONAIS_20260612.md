# Diagnóstico das telas operacionais

Data: 2026-06-12

## Objetivo

Avaliar as telas operacionais do LIKE Estoque antes de qualquer nova alteração funcional.

Escopo avaliado:

```text
Entrada
Entrada em lote
Saída
Devolução
Manutenção
Baixa
Operação rápida
Retorno sem cadastro
Confirmar instalação
Lotes de saída
Inventário por bipagem
```

## Resultado executivo

As telas principais de movimentação estão em bom estado operacional.

Não foi identificada necessidade de mexer imediatamente em banco, RPC ou regra de negócio.

A recomendação é não fazer alteração ampla agora. Próximas melhorias devem ser pequenas e por tela.

## 1. Diálogos nativos do navegador

Busca realizada:

```text
alert(
confirm(
prompt(
```

Resultado relevante:

```text
As telas principais de entrada, saída, devolução e manutenção não apareceram como problema principal.
```

Ocorrências relevantes ainda existem em módulos administrativos e alguns módulos periféricos:

```text
clean/backup.js
clean/producao.js
clean/permissoes.js
clean/relatorios.js
clean/baixa_equipamento.js
clean/operacao_rapida.js
clean/lotes_saida.js
clean/analise_operacional.js
clean/impacto_fechamento.js
```

Observação:

```text
Backup e Produção foram mantidos como estão por decisão operacional, pois são telas administrativas restritas ao suporte/desenvolvedor.
```

## 2. Busca pesada direta em tabela

Busca realizada:

```text
table('equipamentos
```

Resultado relevante:

```text
clean/inventario_bip.js
clean/confirmar_instalacao.js
```

Interpretação:

- Isso não exige correção imediata.
- Porém, no futuro, se o volume de equipamentos crescer muito, essas telas podem precisar migrar para RPC de busca paginada.
- As telas de pesquisa operacional comum já estão usando `rpc_pesquisar_equipamentos_7a5`.

## 3. RPCs operacionais específicas

Foi confirmada presença de RPCs corretas nos fluxos principais.

Exemplos encontrados:

```text
rpc_pesquisar_equipamentos_7a5
rpc_registrar_saida_equipamento
rpc_operacao_rapida_busca_7a5
rpc_operacao_rapida_saida_lote
```

Conclusão:

```text
O sistema está evitando depender de leitura direta pesada nas telas comuns de pesquisa e saída.
```

## 4. Diagnóstico por tela

### Entrada

Estado:

```text
Bom.
```

Pontos fortes:

```text
MAC e Serial/SN separados.
Fluxo com conferência antes de gravar.
Uso de RPC oficial.
```

Risco atual:

```text
Baixo.
```

Ação recomendada:

```text
Não mexer agora.
```

---

### Entrada em lote

Estado:

```text
Bom.
```

Pontos fortes:

```text
Pré-cadastro em lote.
Validação de duplicidade local e no sistema.
Fluxo adequado para MAC/SN.
Uso de RPC de lote.
```

Risco atual:

```text
Baixo.
```

Ação recomendada:

```text
Não mexer agora.
```

---

### Saída

Estado:

```text
Bom.
```

Pontos fortes:

```text
Usa busca por RPC.
Filtra equipamento em estoque.
Evita leitura geral de equipamentos.
```

Risco atual:

```text
Baixo.
```

Ação recomendada:

```text
Não mexer agora.
```

---

### Devolução

Estado:

```text
Bom.
```

Pontos fortes:

```text
Usa rpc_pesquisar_equipamentos_7a5.
Fluxo controlado.
```

Risco atual:

```text
Baixo.
```

Ação recomendada:

```text
Não mexer agora.
```

---

### Manutenção

Estado:

```text
Bom.
```

Pontos fortes:

```text
Usa busca por RPC.
Fluxo de manutenção separado de baixa e devolução.
```

Risco atual:

```text
Baixo.
```

Ação recomendada:

```text
Não mexer agora.
```

---

### Baixa

Estado:

```text
Bom, com pequena dívida de UX.
```

Ponto de atenção:

```text
Busca por prompt ainda aparece no diagnóstico geral.
```

Risco atual:

```text
Médio-baixo.
```

Ação recomendada futura:

```text
Criar etapa específica: Baixa UX.
Não misturar com banco nem RPC.
```

---

### Operação rápida

Estado:

```text
Funcional.
```

Pontos fortes:

```text
Usa rpc_operacao_rapida_busca_7a5.
Usa rpc_operacao_rapida_saida_lote.
Centraliza operação mista de equipamento e material.
```

Ponto de atenção:

```text
Aparece no diagnóstico de prompt, provavelmente fallback de cópia ou confirmação auxiliar.
```

Risco atual:

```text
Médio-baixo.
```

Ação recomendada futura:

```text
Operação rápida UX, somente se o uso diário mostrar incômodo.
```

---

### Retorno sem cadastro

Estado:

```text
Bom.
```

Pontos fortes:

```text
Usa busca centralizada.
Não apareceu como problema de diálogo nativo.
```

Risco atual:

```text
Baixo.
```

Ação recomendada:

```text
Não mexer agora.
```

---

### Confirmar instalação

Estado:

```text
Bom e testado.
```

Pontos fortes:

```text
Tela incorporada ao menu oficial.
Carrega normalmente.
Permissão operacao_estoque preservada.
```

Ponto de atenção futuro:

```text
Ainda pode usar table('equipamentos') para carregar lista.
Se o estoque crescer muito, migrar para RPC paginada.
```

Risco atual:

```text
Baixo.
```

Ação recomendada:

```text
Não mexer agora.
```

---

### Lotes de saída

Estado:

```text
Funcional.
```

Ponto de atenção:

```text
Aparece no diagnóstico de prompt.
Provavelmente fallback de cópia/relatório.
```

Risco atual:

```text
Baixo.
```

Ação recomendada futura:

```text
Melhoria UX apenas se incomodar no uso.
```

---

### Inventário por bipagem

Estado:

```text
Funcional.
```

Ponto de atenção:

```text
Aparece como uso direto de table('equipamentos').
```

Interpretação:

```text
Inventário naturalmente precisa comparar muitos itens.
Não é problema imediato, mas pode exigir RPC própria se o volume crescer.
```

Risco atual:

```text
Médio-baixo para performance futura.
```

Ação recomendada futura:

```text
Criar RPC de apoio ao inventário apenas quando o volume real justificar.
```

## Prioridade recomendada

### Não mexer agora

```text
Entrada
Entrada em lote
Saída
Devolução
Manutenção
Retorno sem cadastro
Confirmar instalação
```

### Melhorias futuras, baixa prioridade

```text
Baixa UX
Operação rápida UX
Lotes de saída UX
```

### Melhorias futuras, performance

```text
Inventário por bipagem com RPC própria
Confirmar instalação com busca paginada, se o volume aumentar
```

### Administrativo congelado por decisão do usuário

```text
Backup
Produção
```

## Decisão técnica final

Não há necessidade de alteração imediata nas telas operacionais principais.

A melhor decisão agora é observar o uso real do sistema e só mexer quando houver dor operacional concreta.

## Próximo passo sugerido

```text
Rodar uso normal por alguns dias.
Registrar qualquer tela que travar, ficar lenta ou confundir o técnico.
Depois escolher uma correção pequena por vez.
```
