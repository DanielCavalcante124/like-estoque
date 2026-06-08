# Entrega 6E - Testes reais por usuário e ajuste fino de permissões

Data: 2026-06-08

## Objetivo

Criar validação formal dos perfis do sistema após a aplicação da matriz de permissões da 6D.

A etapa 6E cobre:

- validação automática da matriz de permissões
- confirmação dos usuários ativos por perfil
- tela admin para teste real com cada login
- registro do resultado do teste manual
- histórico dos testes
- PDF jsPDF
- resumo WhatsApp

## Logins validados

Usuários Auth existentes e vinculados:

- estoque@sejalike.com.br -> admin
- gestor@sejalike.com.br -> gestor
- operador@sejalike.com.br -> operador
- tecnico@sejalike.com.br -> tecnico

## Backend

Migration aplicada:

- testes_reais_perfis_6e

Correções aplicadas:

- criar_funcao_permissao_por_perfil_6e
- corrigir_validacao_matriz_perfis_6e

## Tabela criada

- public.testes_perfis_6e

Campos:

- id
- perfil
- user_id
- email
- resultado
- observacao
- checklist
- testado_por
- testado_em

## Segurança

A tabela tem RLS ativo.

Políticas:

- select somente para admin
- insert direto bloqueado
- update direto bloqueado

O registro acontece somente via RPC admin.

## Funções criadas

### public.app_has_permission_for_profile_6e

Função auxiliar para validar uma permissão contra um perfil informado, sem depender do usuário logado.

Usada para comparar matriz esperada x matriz real.

### public.rpc_validar_matriz_perfis_6e

Valida todos os usuários ativos em public.user_profiles.

Retorna:

- ok
- gerado_em
- resumo
- usuarios

Cada usuário retorna:

- user_id
- email
- perfil
- tecnico_nome
- ativo
- esperado
- atual
- divergencias
- ok

### public.rpc_registrar_teste_perfil_6e

Registra o teste real feito pelo administrador.

Parâmetros:

- perfil
- user_id
- email
- resultado
- observacao
- checklist

Resultados aceitos:

- Aprovado
- Reprovado
- Pendente

Também grava audit_log.

### public.rpc_listar_testes_perfis_6e

Lista histórico dos testes reais registrados.

## Validação automática

Resultado da matriz:

- admin = ok
- gestor = ok
- operador = ok
- tecnico = ok

Todos vieram com:

- ok = true
- divergencias = []

## Matriz validada

### Admin

Permissões:

- usuários
- produção
- backup
- relatórios
- auditoria
- fechamento
- operação
- cadastros
- materiais
- equipamentos
- baixa
- manutenção
- consulta

### Gestor

Permissões permitidas:

- relatórios
- auditoria
- fechamento
- operação
- cadastros
- materiais
- equipamentos
- baixa
- manutenção
- consulta

Bloqueadas:

- usuários
- produção
- backup

### Operador

Permissões permitidas:

- operação
- cadastros
- materiais
- equipamentos
- manutenção
- consulta

Bloqueadas:

- usuários
- produção
- backup
- relatórios
- auditoria
- fechamento
- baixa

### Técnico

Permissões permitidas:

- operação
- equipamentos
- consulta

Bloqueadas:

- usuários
- produção
- backup
- relatórios
- auditoria
- fechamento
- cadastros
- materiais
- baixa
- manutenção

## Teste de registro manual

Foi feito um teste de registro manual com rollback para o perfil operador.

Resultado:

- registro criado corretamente
- resultado = Aprovado
- checklist salvo
- rollback executado
- nenhum dado falso permanente ficou salvo

## Frontend

Arquivo criado:

- clean/teste_perfis.js

Arquivo alterado:

- index-clean.html

## Tela criada

Menu:

- Teste perfis

A tela só aparece para admin.

Ela usa:

- rpc_usuario_contexto_6c

Se não for admin:

- menu não aparece
- página é removida

## Funcionalidades da tela

- revalidar matriz automática
- listar usuários/perfis ativos
- mostrar permissões permitidas e bloqueadas
- selecionar usuário/perfil
- mostrar checklist de teste real
- registrar resultado do teste
- listar histórico
- copiar resumo WhatsApp
- baixar PDF jsPDF

## PDF jsPDF

Arquivo gerado:

- teste_perfis_6e.pdf

Inclui:

- status da matriz
- usuários/perfis
- resultado da matriz
- histórico de testes registrados
- campo de assinatura

## WhatsApp

Resumo inclui:

- status da matriz
- usuários ativos
- divergências
- testes registrados
- status por perfil

## Cache atualizado

index-clean.html agora carrega:

- clean/teste_perfis.js?v=1

Marca visual:

- Etapas 5C-6E

## Roteiro de teste real

Abrir:

/index-clean.html?v=6e-teste-perfis

### Passo 1 - Admin

1. Login com estoque@sejalike.com.br.
2. Abrir Teste perfis.
3. Clicar Revalidar matriz.
4. Confirmar status OK.
5. Conferir usuários listados.

### Passo 2 - Testar Gestor

1. Sair.
2. Login com gestor@sejalike.com.br.
3. Confirmar que não aparece Produção, Backup e Usuários.
4. Confirmar que aparece Fechamento, Auditoria, Relatórios e operações gerenciais.
5. Voltar como admin.
6. Registrar teste do gestor como Aprovado/Reprovado.

### Passo 3 - Testar Operador

1. Sair.
2. Login com operador@sejalike.com.br.
3. Confirmar que não aparece Fechamento, Auditoria, Relatórios, Produção, Backup, Usuários e Baixa.
4. Confirmar que aparece operação, cadastros, materiais, equipamentos e manutenção.
5. Voltar como admin.
6. Registrar teste do operador.

### Passo 4 - Testar Técnico

1. Sair.
2. Login com tecnico@sejalike.com.br.
3. Confirmar que aparece operação/equipamentos/consulta.
4. Confirmar que não aparece cadastros, materiais, manutenção, baixa, fechamento, auditoria, relatórios, produção, backup e usuários.
5. Voltar como admin.
6. Registrar teste do técnico.

## Status

6E concluída.

## Próxima etapa recomendada

6F - Ajuste fino pós-teste real.

Objetivo:

Após você entrar com cada login e registrar os resultados, corrigir permissões excessivas ou insuficientes encontradas no uso real.
