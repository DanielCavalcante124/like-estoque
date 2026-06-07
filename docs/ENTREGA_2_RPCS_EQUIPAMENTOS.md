# Entrega 2 - RPCs de equipamentos

Data: 2026-06-07

## Objetivo

Mover fluxos criticos de equipamentos para funcoes transacionais no Supabase e parar de tratar baixa como exclusao definitiva no frontend.

## Migration aplicada

- entrega_2_rpcs_equipamentos
- entrega_2_documentacao_funcoes_equipamentos

## Funcoes criadas

- rpc_registrar_entrada_equipamento
- rpc_registrar_saida_equipamento
- rpc_registrar_devolucao_equipamento
- rpc_registrar_manutencao_equipamento
- rpc_baixar_equipamento
- like_next_code
- like_norm_text

## Alteracao no frontend

Arquivo alterado:

- app.js

Fluxos alterados:

- entrada de equipamento agora chama rpc_registrar_entrada_equipamento
- saida de equipamento agora chama rpc_registrar_saida_equipamento
- devolucao agora chama rpc_registrar_devolucao_equipamento
- manutencao/inutilizacao agora chama rpc_registrar_manutencao_equipamento
- antigo botao Excluir agora virou Baixar e chama rpc_baixar_equipamento

## Regra nova

Equipamento nao deve ser excluido definitivamente.

Fluxo correto:

1. informar motivo
2. chamar rpc_baixar_equipamento
3. marcar ativo como false
4. status vira Baixado
5. registrar movimento
6. preservar historico

## Preparacao para Windows/offline

Todos os fluxos criticos usam client_operation_id para evitar duplicidade futura em sincronizacao offline.

## Pontos ainda pendentes

- RLS por perfil ainda nao foi fechada.
- Edicao manual de equipamento ainda existe no frontend e deve ser substituida por RPC especifica.
- Cadastros de modelo, tecnico e local ainda usam insert/update/delete direto.
- Materiais ainda precisam ir para RPCs transacionais na proxima etapa.
