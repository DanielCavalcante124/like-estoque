# Diagnóstico - Idempotência amigável por client_operation_id

Data: 2026-06-12

## Objetivo

Avaliar se as operações críticas que recebem `client_operation_id` tratam reenvio, clique duplo e repetição de requisição de forma segura, estável e amigável.

Esta etapa foi somente diagnóstico.

Nenhuma migration foi aplicada.

Nenhum dado foi alterado.

## Conceito

`client_operation_id` deve funcionar como chave de idempotência.

Objetivo:

```text
Se o usuário clicar duas vezes, perder conexão ou reenviar a mesma operação, o sistema não deve duplicar a movimentação.
```

Comportamento ideal:

```text
1. Primeira chamada grava normalmente.
2. Segunda chamada com o mesmo client_operation_id não grava de novo.
3. Segunda chamada retorna resposta amigável indicando que a operação já foi registrada.
```

## Estrutura atual do banco

Foi confirmado que `client_operation_id` existe em:

```text
movimentos
materiais_movimentos
teste_movimentos
```

As tabelas reais possuem índices únicos parciais:

```text
movimentos_client_operation_id_uidx
materiais_movimentos_client_operation_id_uidx
```

Definição lógica:

```text
UNIQUE(client_operation_id) WHERE client_operation_id IS NOT NULL
```

## Ponto positivo

O banco já impede duplicidade persistente quando `client_operation_id` é informado.

Isso protege a integridade.

## Ponto de atenção

Nem todas as RPCs tratam duplicidade com retorno amigável.

Em algumas operações, o índice único pode impedir a duplicação, mas o usuário pode receber erro técnico de banco.

## Frontend

A busca no código mostrou uso de `client_operation_id` e `crypto.randomUUID` em telas operacionais principais:

```text
clean/auditoria.js
clean/materiais.js
clean/manutencao_equipamento.js
clean/retorno_sem_cadastro.js
clean/saida_equipamento.js
clean/confirmar_instalacao.js
clean/devolucao_equipamento.js
clean/baixa_equipamento.js
clean/operacao_rapida.js
```

Interpretação:

```text
O frontend já está no caminho certo: envia IDs únicos por operação.
```

## Classificação por função

### Já possui comportamento idempotente mais claro

```text
rpc_corrigir_local_divergente_5v21
rpc_criar_fechamento_operacional_5w
rpc_cancelar_fechamento_operacional_5w1
```

Sinais encontrados:

```text
checagem por client_operation_id
mensagem/retorno idempotente
consulta prévia em movimentos ou tabela relacionada
```

### Possui proteção no banco, mas pode retornar erro técnico

```text
rpc_confirmar_instalacao_cliente
rpc_registrar_saida_equipamento_core
rpc_registrar_devolucao_equipamento_core
rpc_registrar_manutencao_equipamento_core
rpc_baixar_equipamento_controlado
rpc_baixar_equipamento_core
rpc_movimentar_material_core
```

Sinais encontrados:

```text
usa client_operation_id
insere em movimentos ou materiais_movimentos
há índice único protegendo duplicidade
não apareceu tratamento claro de unique_violation ou retorno idempotente amigável
```

### Entrada de equipamento

```text
rpc_registrar_entrada_equipamento_core
```

Sinais encontrados:

```text
usa client_operation_id
insere em movimentos
possui ON CONFLICT em algum ponto
```

Classificação:

```text
Melhor que a média, mas ainda merece revisão manual antes de mexer.
```

### Entrada em lote

```text
rpc_registrar_entrada_equipamento_lote
```

Ponto de atenção:

```text
usa client_operation_id geral, mas cada item do lote também gera operações internas.
```

Risco:

```text
Não mexer sem teste controlado. Fluxo de lote é sensível e pode gerar duplicidade parcial se mal alterado.
```

### Operação rápida

```text
rpc_operacao_rapida_saida_lote
```

Sinais encontrados:

```text
usa client_operation_id
tem FOR UPDATE
tem ON CONFLICT em algum ponto
tem audit_log
```

Classificação:

```text
Boa, mas sensível por misturar equipamento e material.
Não mexer primeiro.
```

### Materiais

Fluxos:

```text
rpc_entrada_material
rpc_saida_material_tecnico
rpc_consumo_material_tecnico
rpc_movimentar_material_core
```

Situação:

```text
materiais_movimentos possui índice único por client_operation_id
wrappers públicos chamam funções core/genéricas
```

Ponto de atenção:

```text
não apareceu retorno idempotente amigável claro
```

## Prioridade recomendada

### Prioridade 1 - Confirmar instalação

Função:

```text
rpc_confirmar_instalacao_cliente
```

Motivo:

```text
Foi recentemente endurecida com permissão interna e audit_log.
É uma função isolada, menor, e crítica.
É boa candidata para padronizar resposta idempotente amigável.
```

Recomendação:

```text
Adicionar checagem inicial: se p_client_operation_id já existir em movimentos, retornar o equipamento/movimento já registrado sem gravar novamente.
```

### Prioridade 2 - Saída de equipamento

Função:

```text
rpc_registrar_saida_equipamento_core
```

Motivo:

```text
Operação diária, sensível, com risco de clique duplo.
```

### Prioridade 3 - Devolução e manutenção

Funções:

```text
rpc_registrar_devolucao_equipamento_core
rpc_registrar_manutencao_equipamento_core
```

Motivo:

```text
Também são operações diárias, mas menor risco de duplicidade operacional grave que saída.
```

### Prioridade 4 - Materiais

Função base:

```text
rpc_movimentar_material_core
```

Motivo:

```text
Afeta entrada, saída e consumo de material.
Deve ser analisada com muito cuidado antes de alterar, pois uma mudança nela impacta três fluxos.
```

### Prioridade 5 - Operação rápida

Função:

```text
rpc_operacao_rapida_saida_lote
```

Motivo:

```text
É sensível e já possui sinais de tratamento melhor.
Não deve ser a primeira alteração.
```

## Melhor próxima melhoria recomendada

Aplicar idempotência amigável primeiro em:

```text
rpc_confirmar_instalacao_cliente
```

Motivo:

```text
Escopo pequeno.
Risco controlado.
Função crítica.
Já possui audit_log e movimento.
Mais fácil validar.
```

## Como deve ser feito com segurança

```text
1. Ler definição completa atual da função.
2. Antes de alterar qualquer dado, checar se p_client_operation_id já existe em movimentos.
3. Se existir, retornar jsonb com ok=true, acao='idempotente', equipamento_id, movimento_id e mensagem amigável.
4. Se não existir, seguir fluxo atual exatamente como está.
5. Não alterar frontend.
6. Não alterar tabela.
7. Validar por catálogo.
8. Testar somente com caso real ou com transação rollback se possível.
```

## Segurança

Não remover o índice único.

Não aceitar `client_operation_id` nulo como idempotência.

Não retornar dados sensíveis além do que a própria função já retornaria.

Não mascarar erro de operação diferente usando o mesmo UUID para outro equipamento.

## Escalabilidade

Checagem por `client_operation_id` é eficiente porque existe índice único em `movimentos`.

Evitar busca por texto, status ou data para detectar duplicidade.

Usar sempre igualdade por UUID.

## Estabilidade

A correção deve ser local e mínima.

Não mudar regra de status.

Não mudar retorno de sucesso normal.

Não mudar gravação de movimentos.

Não mudar audit_log complementar.

## Acertos registrados

```text
1. Diagnosticar antes de aplicar migration.
2. Separar proteção de integridade do banco de UX amigável.
3. Não confundir índice único com idempotência completa.
4. Priorizar função menor antes de mexer em core genérico.
5. Não mexer primeiro em operação rápida nem materiais genéricos.
```

## Erros a evitar

```text
1. Aplicar idempotência em massa.
2. Mexer em rpc_movimentar_material_core sem entender todos os fluxos.
3. Usar client_operation_id nulo para comparar duplicidade.
4. Retornar sucesso idempotente para operação diferente com mesmo UUID sem validar equipamento.
5. Remover constraint única achando que resolve erro do usuário.
```
