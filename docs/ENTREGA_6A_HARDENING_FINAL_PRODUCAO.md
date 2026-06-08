# Entrega 6A - Hardening final de producao

Data: 2026-06-08

## Objetivo

Executar hardening final antes de considerar a versao pronta para uso operacional continuo.

A etapa 6A cobre:

- permissao de RPCs
- bloqueio de execucao direta de funcoes internas
- indices de performance
- healthcheck tecnico de producao
- tela de validacao no frontend
- PDF tecnico jsPDF
- resumo WhatsApp
- checklist operacional

## Auditoria inicial

Foi auditado:

- tabelas com RLS
- politicas RLS
- RPCs executaveis por anon
- RPCs security definer
- indices existentes

Ponto real encontrado:

- rpc_criar_modelo com parametro exige_mac_sn estava executavel por anon
- rpc_editar_modelo completo estava executavel por anon
- rpc_registrar_saida_equipamento_core estava executavel por authenticated

## Backend - Correcoes de seguranca

Migration aplicada:

- hardening_producao_6a_permissoes_indices_healthcheck

### RPCs administrativas corrigidas

Revogado execute de anon/public e garantido execute somente para authenticated nas assinaturas:

- public.rpc_criar_modelo(text, text, text, numeric, integer, integer, text, text, text, text, boolean)
- public.rpc_editar_modelo(uuid, text, text, text, numeric, integer, integer, text, text, text, text, boolean)

### Funcoes core internas bloqueadas

Execucao direta revogada de public/anon/authenticated para:

- rpc_baixar_equipamento_core
- rpc_consumo_material_tecnico_core
- rpc_entrada_material_core
- rpc_movimentar_material_core
- rpc_registrar_devolucao_equipamento_core
- rpc_registrar_entrada_equipamento_core
- rpc_registrar_manutencao_equipamento_core
- rpc_saida_material_tecnico_core
- rpc_registrar_saida_equipamento_core

Motivo:

- funcoes core devem ser chamadas apenas por wrappers RPC publicos autenticados
- isso reduz superficie de erro e ataque

## Backend - Indices adicionados

Foram adicionados indices seguros com if not exists:

- movimentos_data_created_idx
- movimentos_tipo_data_idx
- movimentos_tecnico_data_idx
- movimentos_destino_data_idx
- materiais_movimentos_created_tipo_idx
- materiais_movimentos_tecnico_created_idx
- fechamentos_operacionais_status_periodo_created_idx
- equipamentos_ativo_status_local_idx
- modelos_categoria_ativo_idx

Objetivo:

- acelerar relatorios gerenciais
- acelerar fechamento operacional
- acelerar impacto de periodo fechado
- melhorar filtros por status, local, tecnico, data e tipo

## Backend - Healthcheck de producao

RPC criada:

- public.rpc_healthcheck_producao_6a

Ela valida:

- tabelas sem RLS
- RPCs executaveis por anon
- resumo da auditoria operacional
- validacao do periodo atual
- contagens principais do sistema

Retorno inclui:

- ok
- gerado_em
- tabelas_sem_rls
- rpc_executaveis_por_anon
- auditoria_resumo
- periodo_atual
- contagens
- recomendacao

## Resultado do healthcheck

Resultado validado:

- ok = true
- tabelas_sem_rls = []
- rpc_executaveis_por_anon = []
- auditoria total = 0
- periodo atual nao bloqueado

Contagens no momento da validacao:

- equipamentos = 17
- movimentos = 145
- materiais_movimentos = 16
- fechamentos = 2
- usuarios_perfil = 1

Recomendacao retornada:

- Healthcheck de producao aprovado nos criterios automaticos 6A.

## Frontend

Arquivo criado:

- clean/producao.js

Arquivo alterado:

- index-clean.html

## Tela criada

Menu:

- Producao

Funcionalidades:

- Executar healthcheck
- Baixar PDF tecnico
- Copiar resumo WhatsApp

## Componentes da tela

A tela mostra:

- Status de producao
- Contagens do sistema
- Seguranca
- RLS
- RPCs anonimas
- Cores internas
- Auditoria operacional
- Periodo atual
- Checklist operacional de producao

## PDF tecnico jsPDF

Arquivo gerado:

- healthcheck_producao_6a.pdf

Inclui:

- status
- data/hora
- recomendacao
- contagens principais
- auditoria total
- RPCs anon
- tabelas sem RLS
- periodo atual
- campo de assinatura tecnica

## WhatsApp

Resumo WhatsApp inclui:

- status
- data/hora
- equipamentos
- movimentos
- fechamentos
- auditoria
- tabelas sem RLS
- RPCs anon
- recomendacao

## Cache atualizado

index-clean.html agora carrega:

- clean/producao.js?v=1

A marca visual foi atualizada para:

- Etapas 5C-6A

## Limites conscientes da 6A

### Backup

A tela alerta sobre backup, mas nao executa backup automaticamente.

Motivo:

- backup deve ser feito pelo Supabase Dashboard, CLI ou automacao controlada
- nao e seguro criar backup operacional completo pelo frontend

### Dependencias CDN

Supabase JS e jsPDF ainda carregam via CDN.

Isso e aceitavel para esta fase, mas o endurecimento maximo futuro seria hospedar copias locais versionadas.

### Logs de tentativa bloqueada

Triggers que usam RAISE EXCEPTION nao persistem tentativa bloqueada automaticamente.

Para registrar tentativa bloqueada, e necessario validar antes pela camada de aplicacao/RPC ou log externo.

## Roteiro de teste

Abrir:

/index-clean.html?v=6a-producao

Testar:

1. Fazer login.
2. Abrir Producao.
3. Clicar Executar healthcheck.
4. Confirmar status Aprovado.
5. Confirmar RPCs anon = 0.
6. Confirmar tabelas sem RLS = 0.
7. Confirmar auditoria = 0 divergencias.
8. Clicar Copiar resumo WhatsApp.
9. Clicar Baixar PDF tecnico.

## Status

6A concluida.

## Proxima etapa recomendada

6B - Backup, recuperação e plano de contingencia.

Objetivo:

Definir rotina formal de backup, exportacao, restauracao, periodicidade, responsavel, teste de recuperacao e plano caso Supabase/GitHub/CDN fiquem indisponiveis.
