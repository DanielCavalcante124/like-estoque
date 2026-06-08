# Entrega 6B - Backup, recuperação e plano de contingência

Data: 2026-06-08

## Objetivo

Criar estrutura operacional para:

- exportar backup operacional em JSON
- registrar backups executados
- manter histórico de backup
- documentar plano de recuperação
- documentar plano de contingência
- gerar PDF técnico
- gerar resumo WhatsApp
- restringir tudo a admin

## Decisão técnica principal

O sistema não armazena o arquivo de backup dentro do próprio banco.

Motivo:

- se o Supabase falhar, o backup também estaria dentro do ambiente afetado
- backup deve ficar fora do Supabase
- exemplos: Google Drive, HD externo, cofre de arquivos, armazenamento corporativo

A tabela do banco guarda apenas metadados:

- nome do arquivo
- hash
- tamanho
- responsável
- período
- observação
- data/hora

## Limite consciente

O backup operacional JSON não substitui o backup completo oficial do Supabase.

Ele serve para:

- contingência rápida
- conferência de estoque
- auditoria de movimentações
- apoio a restauração
- operação manual temporária

O backup completo deve ser feito via:

- Supabase Dashboard
- Supabase CLI
- rotina externa controlada

## Backend

### Tabela criada

- public.backups_operacionais

Campos:

- id
- tipo
- periodo_inicio
- periodo_fim
- descricao
- arquivo_nome
- hash_texto
- tamanho_estimado_bytes
- responsavel
- observacao
- status
- created_by
- created_at

## Segurança

A tabela tem RLS ativado.

Políticas:

- select somente para admin
- insert direto bloqueado
- update direto bloqueado

Criação de histórico ocorre somente por RPC security definer com app_assert_admin().

## RPCs criadas

### public.rpc_export_backup_operacional_6b

Gera exportação operacional em JSON.

Exige:

- admin

Exporta:

- metadata
- contagens
- modelos
- técnicos
- locais
- tipos de produto
- marcas de produto
- equipamentos
- resumo de materiais por modelo baseado em materiais_movimentos
- movimentos patrimoniais do período
- movimentos de materiais do período
- fechamentos operacionais
- saídas em lote
- snapshot de auditoria
- snapshot de healthcheck

### public.rpc_registrar_backup_operacional_6b

Registra metadados do backup executado.

Grava:

- tipo
- período
- descrição
- arquivo
- hash
- tamanho
- responsável
- observação
- audit_log

### public.rpc_listar_backups_operacionais_6b

Lista histórico de backups registrados.

Exige admin.

### public.rpc_plano_contingencia_6b

Retorna plano operacional com:

- política de backup
- procedimento de backup
- procedimento de recuperação
- cenários de falha
- RTO/RPO sugeridos
- observação técnica

## Correção aplicada

A primeira versão da RPC tentou consultar public.materiais.

Validação mostrou que essa tabela não existe.

Correção aplicada:

- corrigir_backup_operacional_6b_sem_materiais

Agora o backup usa:

- public.materiais_movimentos
- resumo por modelo/material

## Validações backend

### Export admin

Resultado validado:

- ok = true
- arquivo_sugerido gerado
- equipamentos = 17
- modelos = 6
- técnicos = 4
- locais = 8
- movimentos_periodo = 145
- materiais_movimentos_total = 16
- materiais_movimentos_periodo = 16
- fechamentos = 2

### Plano admin

Plano de contingência retornou política com:

- Backup operacional JSON diário
- Backup completo Supabase semanal
- Documentos PDF/comprovantes conforme operação

### Registro de backup

Foi feito registro de teste dentro de transação com rollback.

Resultado:

- registro criado corretamente
- status = Registrado
- hash salvo
- tamanho salvo
- responsável salvo
- rollback executado

### Não-admin

Usuário autenticado sem admin foi bloqueado em:

- exportação de backup
- plano de contingência

Mensagem:

- Acesso restrito ao administrador.

## Frontend

Arquivo criado:

- clean/backup.js

Arquivo alterado:

- index-clean.html

## Tela criada

Menu:

- Backup

O menu só é injetado se:

- rpc_usuario_contexto_6a1 retornar is_admin = true

Se não for admin:

- menu não aparece
- página é removida
- tentativa direta é bloqueada

## Funcionalidades da tela

- selecionar período
- informar responsável
- informar observação/local onde foi salvo
- gerar e baixar JSON
- calcular hash SHA-256
- registrar backup executado
- carregar plano de contingência
- listar histórico de backups registrados
- gerar PDF jsPDF
- copiar resumo WhatsApp

## Arquivo JSON

O navegador baixa arquivo com nome semelhante a:

- like_estoque_backup_operacional_YYYYMMDD_HHMMSS.json

O hash SHA-256 é calculado no frontend para conferência de integridade.

## PDF jsPDF

Arquivo gerado:

- backup_contingencia_6b.pdf

Inclui:

- nome do backup
- período
- tamanho
- hash SHA-256
- contagens principais
- política de backup
- RTO/RPO
- procedimento de recuperação
- campo de assinatura

## WhatsApp

O resumo WhatsApp inclui:

- nome do arquivo
- período
- tamanho
- hash
- equipamentos
- movimentos
- materiais movimentados
- fechamentos
- observação para salvar fora do Supabase

## Cache atualizado

index-clean.html carrega:

- clean/backup.js?v=1

Marca visual:

- Etapas 5C-6B

## Roteiro de teste

Abrir:

/index-clean.html?v=6b-backup-contingencia

### Como admin

1. Fazer login como admin.
2. Confirmar que o menu Backup aparece.
3. Abrir Backup.
4. Conferir período inicial/final.
5. Clicar Gerar e baixar JSON.
6. Confirmar download do arquivo.
7. Conferir hash SHA-256 na tela.
8. Informar responsável.
9. Informar onde salvou o arquivo.
10. Clicar Registrar backup executado.
11. Conferir histórico.
12. Clicar Carregar plano.
13. Baixar PDF plano.
14. Copiar resumo WhatsApp.

### Como não-admin

1. Fazer login com usuário sem admin.
2. Confirmar que o menu Backup não aparece.
3. Confirmar que tentativa direta de RPC retorna Acesso restrito ao administrador.

## Procedimento operacional recomendado

### Diário

- Gerar backup operacional JSON no fim do expediente.
- Salvar fora do Supabase.
- Registrar o backup na tela.

### Semanal

- Fazer backup completo pelo Supabase Dashboard/CLI.
- Guardar fora do Supabase.
- Validar se o arquivo abre.

### Antes de mudanças grandes

- Fazer backup operacional JSON.
- Fazer backup completo Supabase.
- Só depois aplicar alterações.

## RTO/RPO sugeridos

RTO:

- até 4 horas para operação mínima usando backup JSON e frontend alternativo.

RPO:

- até 1 dia se o backup operacional diário for seguido corretamente.

## Status

6B concluída.

## Próxima etapa recomendada

6C - Controle de usuários, perfis e permissões.

Objetivo:

Criar painel admin para visualizar usuários, perfis, status ativo/inativo e preparar controle formal de permissões por função.
