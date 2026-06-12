# UX - Usuários com modal interno

Data: 2026-06-12

## Objetivo

Remover diálogos nativos do navegador da tela administrativa `Usuários`, substituindo por modal interno integrado ao layout do LIKE Estoque.

## Arquivo alterado

```text
clean/usuarios.js
```

## Alterações principais

Foram removidos do módulo:

```text
alert()
confirm()
prompt()
```

Substituídos por:

```text
modal interno para acesso restrito
modal interno para salvar perfil operacional
modal interno para ativar/inativar perfil com motivo obrigatório
```

## Cache-bust

Atualizado em `index-clean.html`:

```text
clean/usuarios.js?v=2
```

## Segurança e banco de dados

Nenhuma alteração de banco foi feita.

RPCs preservadas:

```text
rpc_usuario_contexto_6c
rpc_perfis_disponiveis_6c
rpc_listar_usuarios_perfis_6c
rpc_salvar_usuario_perfil_6c
rpc_alterar_status_usuario_perfil_6c
```

## Validação técnica

Validação local de sintaxe:

```text
node --check clean/usuarios.js
```

Resultado:

```text
Sem erro de sintaxe.
```

Busca posterior no GitHub:

```text
alert confirm prompt usuarios.js
```

Resultado relevante:

```text
Nenhuma ocorrência em clean/usuarios.js.
Somente documentação antiga apareceu.
```

## Teste recomendado

Após Ctrl+F5, validar:

```text
1. Login com usuário admin.
2. Abrir Usuários.
3. Recarregar lista.
4. Editar um perfil sem salvar, apenas testar modal.
5. Salvar uma alteração segura, se houver caso real.
6. Ativar/inativar perfil de teste, se existir.
7. Confirmar que aparece modal interno, não alerta nativo do navegador.
```

## Teste aprovado

Data: 2026-06-12.

O usuário informou que os testes da aba Usuários deram certo e que o projeto está no caminho certo.

Resultado:

```text
Teste aprovado.
Aba Usuários funcionando.
Modal interno validado.
Cache-bust clean/usuarios.js?v=2 aplicado.
Sem alteração de banco.
```

## Observação importante

A tela continua sem criar senha no Supabase Auth. Ela apenas vincula o usuário Auth já criado e gerencia o perfil operacional.

## Próximos alvos semelhantes

```text
Auditoria
Demais telas que ainda usam prompt/confirm/alert
```
