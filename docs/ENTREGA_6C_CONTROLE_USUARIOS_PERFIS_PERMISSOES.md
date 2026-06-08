# Entrega 6C - Controle de usuários, perfis e permissões

Data: 2026-06-08

## Objetivo

Criar controle administrativo de usuários/perfis para o LIKE Estoque.

A etapa 6C permite:

- listar perfis operacionais
- criar/vincular perfil operacional a usuário Auth existente
- editar nome, perfil, técnico vinculado e status
- ativar/inativar perfil
- auditar alterações
- proteger último admin ativo
- exibir matriz de perfis e permissões
- restringir painel somente a admin

## Decisão técnica principal

A tela 6C não cria login/senha.

Motivo:

- criar usuário Auth pelo frontend exigiria service role
- service role nunca deve ficar no navegador
- criação de login deve ser feita no Supabase Auth/Admin
- depois o UUID do usuário Auth é vinculado ao perfil operacional na tela Usuários

## Backend

Migration aplicada:

- controle_usuarios_perfis_6c

Correção aplicada:

- corrigir_constraint_perfis_6c

## Estrutura existente confirmada

Tabela:

- public.user_profiles

Campos:

- id
- user_id
- nome
- perfil
- tecnico_nome
- ativo
- created_at
- updated_at

A tabela possui FK:

- user_profiles.user_id -> auth.users.id

Isso impede vincular perfil a UUID inexistente no Auth.

## Segurança da tabela

A tabela user_profiles já possuía RLS.

Políticas existentes confirmadas:

- admin pode inserir
- admin pode atualizar
- usuário pode ver o próprio perfil
- admin pode ver todos

A etapa 6C adicionou RPCs controladas, sem depender de insert/update direto pelo frontend.

## Perfis formais

Perfis aceitos:

- admin
- gestor
- operador
- estoque
- tecnico
- consulta
- suporte

A constraint antiga user_profiles_perfil_check foi substituída pela constraint compatível:

- user_profiles_perfil_allowed_6c

## Funções criadas/atualizadas

### public.app_perfil_usuario()

Retorna o perfil ativo do usuário autenticado.

### public.app_assert_active_profile()

Bloqueia usuário sem perfil ativo.

### public.rpc_perfis_disponiveis_6c()

Retorna lista de perfis disponíveis com descrição operacional.

### public.rpc_listar_usuarios_perfis_6c()

Lista usuários/perfis com filtros:

- busca
- perfil
- ativo
- limite

Retorna também resumo:

- total
- ativos
- inativos
- admins ativos
- por perfil

### public.rpc_salvar_usuario_perfil_6c()

Cria ou atualiza perfil operacional.

Valida:

- admin
- user_id informado
- nome válido
- perfil permitido
- proteção contra remover último admin

Registra audit_log.

### public.rpc_alterar_status_usuario_perfil_6c()

Ativa ou inativa perfil operacional.

Valida:

- admin
- perfil existente
- proteção contra inativar último admin

Registra audit_log.

### public.rpc_usuario_contexto_6c()

Retorna contexto do usuário atual:

- user_id
- nome
- perfil
- tecnico_nome
- ativo
- is_admin
- permissões calculadas

## Proteções críticas

### Último admin

Não é permitido:

- inativar o último admin ativo
- trocar o último admin para perfil não-admin

Erro retornado:

- Não é permitido inativar/remover o último administrador ativo.

### Não-admin

Usuário sem admin não consegue:

- listar usuários
- salvar perfil
- alterar status
- consultar matriz administrativa

Erro:

- Acesso restrito ao administrador.

## Validações backend

### Contexto admin

Validado:

- perfil = admin
- ativo = true
- is_admin = true
- gerenciar_usuarios = true
- painel_producao = true
- backup = true
- operação de estoque = true

### Atualização com rollback

Foi atualizado o perfil admin mantendo admin dentro de transação com rollback.

Resultado:

- atualização funcionou
- updated_at alterou
- rollback descartou alteração real

### Bloqueio do último admin

Tentativa de inativar o único admin ativo.

Resultado:

- bloqueado corretamente
- mensagem: Não é permitido inativar o último administrador ativo.

### Não-admin

Usuário autenticado sem admin tentou:

- listar usuários
- salvar perfil

Resultado:

- ambos bloqueados
- mensagem: Acesso restrito ao administrador.

## Observação de validação

Existe apenas 1 usuário em auth.users no momento.

Por isso não foi possível testar criação real de um segundo perfil sem criar antes um novo usuário no Supabase Auth.

Isso é correto: a FK impede perfil órfão para usuário inexistente.

## Frontend

Arquivo criado:

- clean/usuarios.js

Arquivo alterado:

- index-clean.html

## Tela criada

Menu:

- Usuários

O menu só aparece se:

- rpc_usuario_contexto_6c retornar is_admin = true

Se não for admin:

- menu é removido
- página é removida
- tentativa direta é bloqueada

## Funcionalidades da tela

- listar perfis cadastrados
- filtrar por busca
- filtrar por perfil
- filtrar por status
- ver total, ativos, inativos e admins ativos
- editar perfil
- ativar/inativar perfil
- salvar perfil operacional
- exigir motivo da alteração
- mostrar matriz de permissões

## Campos da tela

- User ID do Supabase Auth
- Nome/e-mail operacional
- Perfil
- Status
- Técnico vinculado opcional
- Motivo da alteração

## Aviso operacional na tela

A tela informa que:

- não cria senha
- não cria login Auth
- o login deve ser criado no Supabase Auth
- depois o UUID deve ser copiado para o painel Usuários

## Cache atualizado

index-clean.html agora carrega:

- clean/usuarios.js?v=1

Marca visual:

- Etapas 5C-6C

## Roteiro de teste

Abrir:

/index-clean.html?v=6c-usuarios-perfis

### Como admin

1. Fazer login como admin.
2. Confirmar que o menu Usuários aparece.
3. Abrir Usuários.
4. Conferir KPIs.
5. Conferir usuário admin existente.
6. Clicar Editar.
7. Alterar apenas um campo seguro, preencher motivo e salvar.
8. Não inativar o único admin real.
9. Para novo usuário: criar primeiro no Supabase Auth, copiar UUID e salvar perfil na tela.

### Como não-admin

1. Fazer login com usuário sem admin.
2. Confirmar que o menu Usuários não aparece.
3. Confirmar que tentativa direta de RPC retorna Acesso restrito ao administrador.

## Status

6C concluída.

## Próxima etapa recomendada

6D - Aplicar permissões por perfil nas telas operacionais.

Objetivo:

Hoje a 6C cria o cadastro formal de perfis. A próxima etapa deve usar esses perfis para esconder/bloquear telas e ações específicas para operador, técnico, consulta, gestor e suporte.
