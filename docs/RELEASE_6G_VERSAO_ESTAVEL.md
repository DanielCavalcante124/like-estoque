# RELEASE 6G - Versão estável operacional

Data: 2026-06-08

## Status

Versão: 6G-estavel

Status: Estável

Link oficial:

- /index-6g.html

Launcher interno:

- index-6g.html

Destino:

- index-clean.html?v=6g-estavel

## Objetivo da release

Consolidar o LIKE Estoque como versão operacional estável após:

- frontend limpo
- operações de entrada, saída, devolução, manutenção e baixa
- comprovantes PDF/jsPDF e WhatsApp
- relatórios gerenciais
- auditoria operacional
- fechamento por período
- hardening de produção
- backup e contingência
- usuários, perfis e permissões
- testes reais por perfil
- ajuste fino de RLS pós-teste real

## Backend 6G

Migration aplicada:

- revisao_final_producao_6g

Criado:

- public.versoes_sistema
- public.rpc_revisao_final_producao_6g()
- public.rpc_registrar_versao_estavel_6g(text, text)

## Revisão final

Resultado da revisão:

- ok = true
- versao = 6G-estavel
- link_recomendado = /index-clean.html?v=6g-estavel

Resumo técnico:

- healthcheck_ok = true
- matriz_perfis_ok = true
- select_policies_antigas = 0
- gravacao_policies_antigas = 12
- admins_ativos = 1
- usuarios_ativos = 4
- fechamentos = 2
- auditoria_divergencias = 0
- backups_registrados_recentes = 1

## Registro de versão

A versão foi registrada em public.versoes_sistema com:

- versao = 6G-estavel
- status = Estável
- link_oficial = /index-6g.html

## Segurança

As RPCs da 6G exigem admin:

- rpc_revisao_final_producao_6g
- rpc_registrar_versao_estavel_6g

Teste não-admin:

- revisão bloqueada
- registro bloqueado
- mensagem: Acesso restrito ao administrador.

## Frontend

Criado:

- index-6g.html

Função:

- launcher seguro da versão estável
- redireciona para index-clean.html?v=6g-estavel

Motivo:

- a ferramenta bloqueou a regravação completa do index-clean.html
- para reduzir risco, não foi forçada alteração no arquivo principal
- a versão estável foi empacotada em um launcher dedicado

## Link recomendado de produção

Usar preferencialmente:

- /index-6g.html

Link direto alternativo:

- /index-clean.html?v=6g-estavel

## Perfis da versão estável

### Admin

Login principal:

- estoque@sejalike.com.br

Acesso:

- tudo
- Produção
- Backup
- Usuários
- Teste perfis

### Gestor

Login:

- gestor@sejalike.com.br

Acesso:

- relatórios
- auditoria
- fechamento
- operação
- cadastros
- materiais
- equipamentos
- baixa
- manutenção

Bloqueado:

- Produção
- Backup
- Usuários

### Operador

Login:

- operador@sejalike.com.br

Acesso:

- operação
- cadastros
- materiais
- equipamentos
- manutenção

Bloqueado:

- fechamento
- auditoria
- relatórios
- baixa
- produção
- backup
- usuários

### Técnico

Login:

- tecnico@sejalike.com.br

Acesso:

- operação
- equipamentos
- consulta

Bloqueado:

- materiais
- manutenção
- baixa
- fechamento
- auditoria
- relatórios
- produção
- backup
- usuários

## Rotina diária recomendada

No início do expediente:

1. Login admin ou gestor.
2. Conferir Dashboard.
3. Conferir Auditoria/Análise operacional se houver alerta.
4. Validar se há divergências críticas.

Durante a operação:

1. Usar entradas e saídas por fluxo oficial.
2. Evitar edição direta no Supabase.
3. Gerar comprovantes quando aplicável.
4. Usar WhatsApp de comprovante para rastreabilidade.

Fim do expediente:

1. Gerar backup operacional JSON.
2. Salvar fora do Supabase.
3. Registrar backup na tela Backup.
4. Conferir alertas do dashboard.

## Rotina semanal

1. Backup completo pelo Supabase Dashboard/CLI.
2. Conferir se arquivo abre.
3. Guardar fora do Supabase.
4. Executar Produção/Healthcheck como admin.
5. Conferir matriz de perfis.

## Rollback operacional

Se a versão estável apresentar problema visual:

1. Abrir diretamente index-clean.html com cache anterior conhecido.
2. Recarregar com parâmetro antigo se necessário.
3. Conferir console do navegador.
4. Usar backup JSON para conferência operacional.
5. Não editar dados manualmente sem diagnóstico.

Se o banco apresentar problema:

1. Parar operação crítica.
2. Gerar evidências.
3. Conferir último backup JSON.
4. Restaurar backup completo somente com planejamento.
5. Rodar healthcheck e auditoria depois.

## Decisão técnica

A versão 6G está liberada como estável operacional.

Não significa fim do desenvolvimento, mas sim base confiável para uso diário.

Próximas melhorias devem ser tratadas como 7A em diante, para não misturar estabilização com novas funcionalidades.
