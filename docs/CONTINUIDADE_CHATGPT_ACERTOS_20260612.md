# Continuidade ChatGPT - Acertos operacionais

Data: 2026-06-12

## Objetivo

Registrar os acertos do fluxo de trabalho que estão funcionando no projeto LIKE Estoque, para manter o padrão nas próximas etapas.

## Acerto 1 - Diagnosticar antes de alterar

Antes de bloquear RPC, alterar frontend ou mexer em banco:

```text
1. Buscar no GitHub.
2. Fazer busca individual quando o nome for sensível.
3. Ler o arquivo ativo.
4. Confirmar se o script é carregado no index-clean.html.
5. Verificar permissões e dependências no Postgres.
6. Só então decidir manter, migrar ou bloquear.
```

Este padrão evitou quebrar:

```text
rpc_corrigir_local_divergente_5v21
```

Motivo: a busca mostrou que ela ainda era usada pela aba Auditoria.

## Acerto 2 - Não bloquear RPC ainda usada pelo frontend

Se uma RPC aparece em `clean/*.js`, ela deve ser tratada como ativa até prova contrária.

Exemplo correto:

```text
rpc_corrigir_local_divergente_5v21 mantida porque é usada em clean/auditoria.js.
```

Exemplo correto de aposentadoria:

```text
Tela Teste perfis foi removida do index-clean.html antes de bloquear as RPCs 6E/6D.
```

## Acerto 3 - Primeiro aposentar a tela, depois bloquear RPC

Fluxo aprovado:

```text
1. Remover carregamento da tela no index-clean.html.
2. Manter o arquivo legado no repositório para rollback.
3. Confirmar que o frontend não chama mais a RPC.
4. Aplicar REVOKE somente nas RPCs aposentadas.
5. Validar grants pós-migration.
6. Testar navegador.
7. Documentar e versionar.
```

Aplicado com sucesso em:

```text
Teste perfis
rpc_validar_matriz_perfis_6e
rpc_listar_testes_perfis_6e
rpc_registrar_teste_perfil_6e
rpc_matriz_permissoes_6d
```

## Acerto 4 - Preservar funções app_* enquanto não houver schema privado

Não revogar novamente:

```text
app_perfil_usuario
app_has_permission
app_assert_permission
app_assert_can_operate_stock
app_is_admin
app_assert_admin
app_assert_active_profile
```

Motivo: RPCs operacionais dependem dessas funções em tempo de execução.

Refatoração futura correta:

```text
Mover app_* para schema privado e manter RPC pública chamando schema privado.
```

## Acerto 5 - UX primeiro em telas críticas, sem mexer no banco

Melhorias seguras recentes:

```text
Fechamento: confirm/prompt substituídos por modal interno.
Usuários: alert/confirm/prompt substituídos por modal interno.
```

Regra:

```text
Quando a melhoria for só UX, não alterar banco, RPC ou permissões.
```

## Acerto 6 - Cache-bust obrigatório depois de alterar JS carregado

Sempre que alterar arquivo JS carregado no `index-clean.html`, atualizar o `?v=`.

Aplicado:

```text
clean/fechamento.js?v=5
clean/usuarios.js?v=2
```

## Acerto 7 - Registrar teste aprovado

Após o usuário testar e confirmar que deu certo, registrar no documento da etapa.

Aplicado em:

```text
docs/UX_FECHAMENTO_MODAL_20260612.md
docs/UX_USUARIOS_MODAL_20260612.md
docs/SEGURANCA_RPC_TESTE_PERFIS_20260612.md
docs/SEGURANCA_RPC_DIAGNOSTICO_20260612.md
```

## Acerto 8 - Versionar toda etapa concluída

Toda etapa validada deve atualizar `version.json`.

Versões recentes aprovadas:

```text
1.1.24 - fechamento-modal-ux
1.1.25 - usuarios-modal-ux
```

## Regra principal para continuar

```text
Procurar primeiro.
Mexer pequeno.
Preservar operacional.
Testar no navegador.
Documentar.
Versionar.
Não repetir revogação agressiva em função auxiliar.
```
