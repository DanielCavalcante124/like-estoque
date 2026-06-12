# Diagnóstico - Rastreabilidade das ações críticas

Data: 2026-06-12

## Objetivo

Analisar se as ações críticas do LIKE Estoque deixam trilha suficiente para auditoria, investigação e estabilidade operacional.

Esta etapa foi somente diagnóstico.

Nenhuma migration foi aplicada.

Nenhum dado foi alterado.

## Critérios avaliados

Para cada fluxo crítico, foram avaliados:

```text
validação interna de permissão
uso de SECURITY DEFINER
bloqueio de anon/public
registro em movimentos
registro em materiais_movimentos
registro em audit_log
uso de client_operation_id
uso de responsável
uso de motivo/observação
uso de FOR UPDATE quando altera equipamento existente
tratamento de erro/exception
idempotência contra clique duplo/reenvio
```

## Estruturas existentes positivas

### Tabela movimentos

A tabela `movimentos` possui campos importantes para rastreabilidade:

```text
equipamento_id
data
created_at
tipo
codigo
mac
serial
tecnico
destino
cliente
os
motivo
condicao
status_final
obs
responsavel
fornecedor
nf
origem
client_operation_id
```

### Tabela materiais_movimentos

A tabela `materiais_movimentos` possui campos importantes:

```text
modelo_id
tipo
marca
modelo
categoria
unidade_saida
quantidade
origem
destino
tecnico
motivo
obs
responsavel
client_operation_id
```

### Tabela audit_log

A tabela `audit_log` possui:

```text
created_at
user_id
tabela
registro_id
acao
resumo
ip
user_agent
```

Ponto de atenção: `ip` e `user_agent` existem, mas normalmente não são preenchidos automaticamente em RPC SQL comum sem integração específica.

## Estabilidade e idempotência

Foram encontrados índices únicos parciais:

```text
movimentos_client_operation_id_uidx
materiais_movimentos_client_operation_id_uidx
```

Isso é positivo porque protege contra duplicidade por clique duplo/reenvio quando `client_operation_id` é usado.

Ponto de atenção:

```text
Nem todas as RPCs parecem tratar o conflito de forma amigável com ON CONFLICT ou unique_violation.
```

Impacto possível:

```text
A duplicidade é bloqueada pelo banco, mas o usuário pode receber erro técnico em vez de retorno idempotente amigável.
```

## Triggers de proteção existentes

Foram encontrados triggers de proteção contra exclusão e alterações em período fechado:

```text
trg_bloquear_delete_equipamentos
trg_bloquear_delete_movimentos
trg_bloquear_delete_materiais_movimentos
movimentos_periodo_aberto_5w2
materiais_movimentos_periodo_aberto_5w2
movimentos_permissoes_6d
materiais_movimentos_permissoes_6d
```

Isso é positivo para estabilidade e segurança operacional.

## Diagnóstico por grupo

### 1. Ações de equipamento com boa trilha

Fluxos:

```text
Entrada de equipamento
Saída de equipamento
Devolução de equipamento
Manutenção de equipamento
Baixa controlada
Correção de local divergente
Confirmar instalação
```

Situação geral:

```text
As RPCs públicas possuem validação interna.
A maioria usa client_operation_id.
As funções core de equipamento registram movimento e/ou audit_log.
Algumas ações específicas registram em movimentos, mas não em audit_log.
```

Ponto importante:

```text
Movimentos é a trilha operacional principal do estoque.
Audit_log é a trilha administrativa/complementar.
```

### Melhorias futuras para equipamento

```text
Padronizar audit_log para todas as ações críticas de equipamento, sem substituir movimentos.
Garantir retorno idempotente amigável para client_operation_id repetido.
```

---

### 2. Ações de material

Fluxos:

```text
Entrada de material
Saída de material para técnico
Consumo de material técnico
```

Situação encontrada:

```text
As RPCs públicas são fachadas com app_assert_can_operate_stock.
As funções core chamam rpc_movimentar_material.
Existe tabela materiais_movimentos com client_operation_id e índice único parcial.
```

Ponto de atenção:

```text
A análise direta da função genérica rpc_movimentar_material foi bloqueada pela ferramenta de segurança do ambiente.
```

Conclusão prudente:

```text
Não classificar como falha confirmada.
Registrar como ponto a auditar com cuidado antes de qualquer alteração.
```

Melhoria futura recomendada:

```text
Diagnóstico específico da função genérica rpc_movimentar_material, sem bloquear nem alterar.
```

---

### 3. Usuários e perfis

Fluxos:

```text
Salvar perfil de usuário
Ativar/inativar usuário/perfil
```

Situação:

```text
Possuem app_assert_admin.
Gravam audit_log.
Usam auth.uid().
Usam motivo.
Usam FOR UPDATE.
```

Classificação:

```text
Boa trilha administrativa.
Não mexer agora.
```

---

### 4. Operação rápida

Fluxo:

```text
Operação rápida de saída em lote com equipamentos e materiais
```

Situação:

```text
Possui app_assert_can_operate_stock.
Usa client_operation_id.
Usa FOR UPDATE.
Possui audit_log.
Possui ON CONFLICT em algum ponto do corpo.
```

Classificação:

```text
Boa trilha e boa estabilidade relativa.
```

Ponto de atenção:

```text
Como mistura equipamento e material, é uma das operações mais sensíveis.
Qualquer alteração futura deve ser testada com rollback antes.
```

## Pontos de atenção principais

### P1 - Padronizar audit_log para ações críticas de equipamento

Ações como Confirmar instalação e Correção de local possuem movimento operacional, mas não apareceram com insert direto em audit_log.

Isso não impede auditoria operacional, pois movimentos guarda trilha.

Mas para segurança administrativa, seria melhor ter também audit_log resumido.

Prioridade:

```text
Média
```

Risco de mexer:

```text
Baixo se feito como insert adicional depois do movimento, sem alterar lógica.
```

---

### P2 - Idempotência amigável

Existem índices únicos por `client_operation_id`, mas algumas RPCs não demonstram `ON CONFLICT` ou tratamento explícito de `unique_violation`.

Hoje o banco protege contra duplicidade, mas o usuário pode receber erro técnico.

Prioridade:

```text
Média
```

Melhoria recomendada:

```text
Padronizar retorno idempotente: se client_operation_id já existe, retornar o movimento/equipamento já gravado em vez de erro bruto.
```

---

### P3 - Material genérico

As funções de material passam por `rpc_movimentar_material`.

A ferramenta bloqueou a inspeção direta dessa função.

Prioridade:

```text
Média-baixa para diagnóstico
```

Ação recomendada:

```text
Tentar diagnóstico seguro da função por partes ou via documentação existente antes de qualquer alteração.
```

---

### P4 - audit_log com IP/User-Agent

A tabela possui campos `ip` e `user_agent`, mas RPCs comuns normalmente não conseguem preencher isso sem receber do frontend ou usar recurso específico.

Prioridade:

```text
Baixa agora
```

Ação futura:

```text
Se precisar rastreabilidade forense forte, adicionar coleta segura de user_agent no frontend e enviar para RPCs críticas ou criar edge function/proxy.
```

## Matriz resumida

| Área | Estado | Risco | Próxima ação |
|---|---|---:|---|
| Equipamentos | Boa trilha por movimentos | Médio | Padronizar audit_log complementar |
| Materiais | Trilha provável por materiais_movimentos | Médio-baixo | Diagnosticar rpc_movimentar_material |
| Usuários/perfis | Boa trilha por audit_log | Baixo | Não mexer agora |
| Operação rápida | Boa trilha, operação sensível | Médio | Não mexer sem teste controlado |
| Idempotência | Banco bloqueia duplicidade | Médio | Melhorar retorno amigável |
| IP/User-Agent | Campos existem, preenchimento incerto | Baixo | Futuro forense |

## Melhor próxima melhoria recomendada

Próxima etapa segura:

```text
Adicionar audit_log complementar para Confirmar instalação e Correção de local divergente.
```

Motivo:

```text
São ações críticas de equipamento.
Já têm movimento operacional.
Adicionar audit_log melhora investigação sem alterar fluxo principal.
```

Como fazer com segurança:

```text
1. Ler definição completa das duas RPCs.
2. Adicionar insert em audit_log após gravação do movimento.
3. Não alterar retorno.
4. Não alterar frontend.
5. Validar catálogo e teste real.
```

## Acertos registrados

```text
1. Diagnóstico antes de migration.
2. Não classificar falso positivo quando RPC pública chama core.
3. Separar trilha operacional (movimentos) de trilha administrativa (audit_log).
4. Considerar idempotência e escalabilidade, não só segurança de acesso.
5. Não insistir em consulta bloqueada pela ferramenta.
```

## Erros a evitar

```text
1. Criar trigger genérico pesado em tabela grande sem medir impacto.
2. Duplicar audit_log e movimentos com payload enorme.
3. Alterar RPC crítica misturando várias melhorias de uma vez.
4. Bloquear função genérica de material sem entender dependências.
5. Trocar estabilidade por auditoria excessiva.
```
