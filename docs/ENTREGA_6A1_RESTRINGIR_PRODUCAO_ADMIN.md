# Entrega 6A.1 - Restringir Produção/Healthcheck somente para admin

Data: 2026-06-08

## Objetivo

Garantir que a tela Produção/Healthcheck 6A não fique disponível para cliente final, técnico comum, suporte básico ou usuário operacional sem permissão administrativa.

Regra principal:

- Produção/Healthcheck é painel interno de administrador.
- Esconder o menu no frontend não é segurança suficiente.
- A trava real precisa estar na RPC do Supabase.

## Backend

Migration aplicada:

- restringir_producao_admin_6a1

## Funções criadas/alteradas

### public.app_is_admin()

Foi endurecida para validar:

- public.user_profiles.user_id = auth.uid()
- perfil = admin
- ativo = true

Também mantém fallback por:

- auth.jwt().app_metadata.perfil = admin

### public.app_assert_admin()

Criada para bloquear execução quando o usuário não for admin.

Erro retornado:

- Acesso restrito ao administrador.

### public.rpc_usuario_contexto_6a1()

Criada para o frontend consultar o contexto do usuário autenticado.

Retorna:

- user_id
- perfil
- nome
- ativo
- is_admin

Essa RPC não retorna dados sensíveis de produção. Serve apenas para UX/visibilidade do menu.

### public.rpc_healthcheck_producao_6a()

Atualizada para exigir:

- public.app_assert_admin()

Antes ela exigia apenas permissão operacional.

Agora o healthcheck técnico só executa para admin.

## Testes backend

### Admin

Usuário admin validado:

- healthcheck executou
- ok = true
- restrito_admin = true
- auditoria = 0
- rpc anon = []
- tabelas sem RLS = []

### Não-admin simulado

Foi simulado usuário autenticado sem perfil admin.

Resultado:

- app_is_admin = false
- rpc_healthcheck_producao_6a bloqueada
- mensagem: Acesso restrito ao administrador.

## Frontend

Arquivo alterado:

- clean/producao.js

Cache atualizado em:

- index-clean.html

Agora carrega:

- clean/producao.js?v=2

## Mudanças no frontend

### Antes

O menu Produção era injetado automaticamente quando o módulo carregava.

### Agora

O módulo executa:

- rpc_usuario_contexto_6a1

E só cria:

- navProducaoClean
- page-producao-clean

quando:

- is_admin = true

Se não for admin:

- remove o menu Produção
- remove a página Produção
- se o usuário estiver nessa tela, volta para Dashboard

## Eventos tratados

O frontend agora revalida acesso admin quando ocorre:

- login
- logout
- tentativa de acesso direto pela função show
- tentativa de executar healthcheck

## Segurança efetiva

A segurança real está no backend:

- rpc_healthcheck_producao_6a exige app_assert_admin()

O frontend apenas melhora UX e evita mostrar tela que o usuário não deve ver.

## Roteiro de teste

Abrir:

/index-clean.html?v=6a1-admin-producao

### Com admin

1. Fazer login com usuário admin.
2. Confirmar que o menu Produção aparece.
3. Abrir Produção.
4. Executar healthcheck.
5. Confirmar status aprovado.
6. Confirmar que o PDF e WhatsApp continuam funcionando.

### Com não-admin

1. Fazer login com usuário não-admin.
2. Confirmar que o menu Produção não aparece.
3. Confirmar que tentativa direta de RPC retorna erro de administrador.

## Status

6A.1 concluída.

## Próxima etapa recomendada

6B - Backup, recuperação e plano de contingência.

Objetivo:

Formalizar rotina de backup, exportação, restauração, periodicidade, responsável e plano de contingência para Supabase, GitHub Pages e CDNs externas.
