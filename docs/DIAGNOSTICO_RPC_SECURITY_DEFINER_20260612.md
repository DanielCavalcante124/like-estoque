# Diagnóstico - RPCs SECURITY DEFINER executáveis por authenticated

Data: 2026-06-12

## Objetivo

Analisar as funções `SECURITY DEFINER` do schema `public` que ainda são executáveis pelo papel `authenticated`.

A análise foi somente leitura.

Nenhuma migration foi aplicada nesta etapa.

## Resultado executivo

A maior parte das RPCs operacionais já possui validação interna por funções de permissão.

A correção anterior em `rpc_confirmar_instalacao_cliente` funcionou: a função agora aparece com `app_assert_can_operate_stock`.

Restaram duas RPCs de leitura sem assert interno claro:

```text
rpc_dashboard_operacional()
rpc_historico_equipamento(uuid)
```

Elas não aparentam escrever dados, mas, por serem `SECURITY DEFINER`, podem bypassar RLS e entregar dados a qualquer usuário logado que consiga chamá-las diretamente.

## Grupos encontrados

### 1. Funções auxiliares app_ em schema public

Funções:

```text
app_perfil_usuario
app_has_permission
app_is_admin
app_assert_active_profile
app_assert_admin
app_assert_can_operate_stock
app_assert_permission
```

Classificação:

```text
Necessárias no estado atual.
Não revogar agora.
```

Motivo:

Essas funções são dependência de várias policies e RPCs operacionais. Revogar sem refatorar já causou erro anteriormente.

Melhor solução futura:

```text
Mover funções auxiliares app_* para schema privado e preservar as RPCs públicas como fachada.
```

---

### 2. RPCs com assert interno

A maioria das RPCs operacionais apareceu com alguma validação interna, como:

```text
app_assert_can_operate_stock
app_assert_admin
app_assert_permission
app_assert_active_profile
```

Classificação:

```text
Aceitável no modelo atual.
Não bloquear em lote.
```

Exemplos:

```text
rpc_confirmar_instalacao_cliente
rpc_registrar_entrada_equipamento
rpc_registrar_saida_equipamento
rpc_operacao_rapida_saida_lote
rpc_entrada_material
rpc_saida_material_tecnico
rpc_consumo_material_tecnico
rpc_baixar_equipamento_controlado
rpc_criar_fechamento_operacional_5w
rpc_cancelar_fechamento_operacional_5w1
rpc_auditoria_divergencias_5v1
rpc_pesquisar_equipamentos_7a5
rpc_materiais_painel_7a5
rpc_tecnicos_resumo_7a5
rpc_tecnico_detalhe_7a5
```

---

### 3. RPCs com checagem indireta

Funções:

```text
rpc_usuario_contexto_6a1
rpc_usuario_contexto_6c
```

Classificação:

```text
Manter por enquanto.
```

Motivo:

São usadas para contexto de sessão/perfil. Retornam permissões e estado do usuário logado.

Ação futura recomendada:

```text
Revisar se retornam somente dados necessários ao frontend.
```

---

### 4. RPCs sem assert interno claro

Funções:

```text
rpc_dashboard_operacional()
rpc_historico_equipamento(uuid)
```

Classificação:

```text
Revisar e endurecer.
```

## Detalhe das duas RPCs pendentes

### rpc_dashboard_operacional()

Uso no frontend:

```text
clean/dashboard.js chama rpc_dashboard_operacional no carregamento do dashboard.
```

A tela Dashboard usa essa RPC para KPIs, distribuição por status/local, alertas e movimentações recentes.

Risco:

```text
Qualquer usuário authenticated com token válido pode tentar chamar diretamente a RPC.
Como a função é SECURITY DEFINER, ela pode entregar dados agregados sem passar pelo RLS do usuário invoker.
```

Ação recomendada:

```sql
perform public.app_assert_permission('consulta');
```

ou, se o dashboard for considerado mais sensível:

```sql
perform public.app_assert_permission('relatorios');
```

Melhor escolha inicial:

```text
consulta
```

Motivo:

Dashboard é a tela inicial e já representa visão geral operacional.

---

### rpc_historico_equipamento(uuid)

Uso no frontend:

```text
clean/historico_equipamento.js chama rpc_historico_equipamento ao carregar a linha do tempo de um equipamento.
```

Risco:

```text
Com um UUID de equipamento, usuário authenticated poderia tentar consultar histórico completo pela API.
A função retorna técnico, destino, cliente, OS, motivo, observações e responsável.
```

Ação recomendada:

```sql
perform public.app_assert_permission('consulta');
```

ou:

```sql
perform public.app_assert_permission('equipamentos');
```

Melhor escolha inicial:

```text
consulta
```

Motivo:

A própria tela de Histórico está associada a consulta operacional.

## Recomendação de próxima migration

Criar migration específica e pequena:

```text
security_assert_readonly_dashboard_historico_20260612
```

Com objetivo de adicionar validação interna nas duas RPCs de leitura:

```text
rpc_dashboard_operacional
rpc_historico_equipamento
```

Sem alterar retorno, frontend ou regras de negócio.

## Acertos registrados

```text
1. Não bloquear RPC em lote.
2. Separar funções auxiliares app_* de RPCs públicas.
3. Identificar se a função escreve dados antes de classificar como crítica.
4. Para RPC de leitura SECURITY DEFINER, ainda exigir permissão interna.
5. Não confundir Advisor com erro imediato; usar catálogo + uso no frontend + corpo da função.
```

## Erros a evitar

```text
1. Revogar EXECUTE de app_* novamente sem mover para schema privado.
2. Bloquear RPC carregada por clean/*.js sem migrar frontend.
3. Aplicar hardening em massa sem teste individual.
4. Tratar RPC de leitura como segura só porque não escreve dados; se é SECURITY DEFINER, ainda pode bypassar RLS.
```
