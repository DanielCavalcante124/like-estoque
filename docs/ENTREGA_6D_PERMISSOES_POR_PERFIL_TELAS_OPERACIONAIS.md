# Entrega 6D - Aplicar permissões por perfil nas telas operacionais

Data: 2026-06-08

## Objetivo

Aplicar a estrutura formal de perfis criada na 6C nas telas e ações operacionais do sistema.

A 6D entrega:

- vínculo dos novos logins Auth a perfis operacionais
- matriz de permissões no backend
- contexto de permissões por usuário
- bloqueios reais em ações críticas no banco
- controle visual global no frontend
- menu/telas filtrados por perfil

## Logins encontrados no Supabase Auth

Foram encontrados os logins:

- estoque@sejalike.com.br
- gestor@sejalike.com.br
- operador@sejalike.com.br
- tecnico@sejalike.com.br

## Perfis vinculados

Foram criados/vinculados em public.user_profiles:

- estoque@sejalike.com.br -> admin
- gestor@sejalike.com.br -> gestor
- operador@sejalike.com.br -> operador
- tecnico@sejalike.com.br -> tecnico

O técnico foi vinculado com tecnico_nome:

- Técnico Teste

Esse nome pode ser ajustado depois na tela Usuários.

## Backend

Migration aplicada:

- permissoes_por_perfil_6d

Migration aplicada para travas críticas:

- travas_operacionais_por_perfil_6d

## Funções criadas/alteradas

### public.app_has_permission(text)

Retorna boolean indicando se o perfil atual possui a permissão solicitada.

Permissões avaliadas:

- admin
- gerenciar_usuarios
- painel_producao
- backup
- relatorios
- auditoria
- fechamento
- operacao_estoque
- cadastros
- materiais
- equipamentos
- baixa
- manutencao
- consulta

### public.app_assert_permission(text)

Bloqueia se o perfil atual não possuir a permissão informada.

Erro:

- Perfil sem permissão para esta ação: PERMISSAO

### public.app_assert_can_operate_stock()

Foi atualizada para chamar:

- app_assert_permission('operacao_estoque')

Assim, usuários sem perfil operacional ativo não executam RPCs operacionais.

### public.rpc_usuario_contexto_6c()

Foi atualizada para retornar permissões completas calculadas pela matriz 6D.

### public.rpc_matriz_permissoes_6d()

Criada para consulta administrativa da matriz de permissões.

## Matriz de permissões aplicada

### admin

Acesso total:

- usuários
- produção
- backup
- relatórios
- auditoria
- fechamento
- operação de estoque
- cadastros
- materiais
- equipamentos
- baixa
- manutenção

### gestor

Acesso gerencial:

- relatórios
- auditoria
- fechamento
- operação de estoque
- cadastros
- materiais
- equipamentos
- baixa
- manutenção

Não acessa:

- produção
- backup
- usuários

### operador

Acesso operacional:

- operação de estoque
- cadastros
- materiais
- equipamentos
- manutenção
- consulta

Não acessa:

- fechamento
- auditoria
- relatórios gerenciais
- baixa definitiva
- produção
- backup
- usuários

### tecnico

Acesso limitado:

- operação de estoque
- equipamentos
- consulta

Não acessa:

- cadastros
- materiais
- manutenção
- baixa
- fechamento
- auditoria
- relatórios
- produção
- backup
- usuários

## Validação dos contextos

A matriz foi testada simulando os quatro usuários.

Resultado:

- admin: tudo true
- gestor: fechamento/relatórios/auditoria/operação/cadastros/baixa/manutenção true; backup/usuários false
- operador: operação/cadastros/materiais/equipamentos/manutenção true; fechamento/baixa/auditoria/backup/usuários false
- tecnico: operação/equipamentos/consulta true; cadastros/materiais/manutenção/baixa/fechamento/backup/usuários false

## Travas críticas no banco

### Fechamentos

Trigger criada:

- fechamentos_permissao_6d

Função:

- trg_fechamentos_permissao_6d

Exige:

- app_assert_permission('fechamento')

### Movimentos patrimoniais

Trigger criada:

- movimentos_permissoes_6d

Função:

- trg_movimentos_permissoes_6d

Exige sempre:

- operacao_estoque

E exige adicionalmente:

- baixa para tipos contendo baixa/inutil
- manutencao para tipos contendo manutenção/manutencao

### Movimentos de materiais

Trigger criada:

- materiais_movimentos_permissoes_6d

Função:

- trg_materiais_movimentos_permissoes_6d

Exige:

- materiais

## Testes de bloqueio no banco

Testes executados com rollback.

Resultado:

- operador não pode fechamento
- operador não pode baixa
- tecnico não pode materiais

As tentativas foram bloqueadas com mensagem de permissão.

Observação:

- INSERT direto em algumas tabelas também é bloqueado por RLS, o que é correto. Operação real deve passar pelas RPCs.

## Frontend

Arquivo criado:

- clean/permissoes.js

Arquivo alterado:

- index-clean.html

## Controle global do frontend

O arquivo permissoes.js:

- chama rpc_usuario_contexto_6c
- lê ctx.permissoes
- esconde menus sem permissão
- esconde página Cadastros quando não permitido
- redireciona para Dashboard se usuário estiver em tela proibida
- observa menus criados dinamicamente por MutationObserver
- reaplica regras periodicamente
- expõe window.permissoes6DRefresh
- expõe window.permissoes6DCan

## Menus controlados

São controlados por ID e por texto:

- Dashboard
- Cadastros
- Usuários
- Backup
- Produção
- Análise operacional
- Impacto fechamento
- Fechamento
- Auditoria
- Relatórios
- Baixa
- Manutenção
- Materiais
- Equipamentos
- Técnicos
- Histórico
- Operação rápida
- Lotes de saída
- Entrada
- Entrada em lote
- Retorno sem cadastro
- Saída
- Devolução

## Card de perfil

A lateral agora mostra:

- perfil atual
- nome/e-mail
- resumo das permissões principais

## Cache atualizado

index-clean.html agora carrega:

- clean/permissoes.js?v=1

A marca visual foi atualizada para:

- Etapas 5C-6D

## Roteiro de teste

Abrir:

/index-clean.html?v=6d-perfis

### Admin

Login:

- estoque@sejalike.com.br

Deve ver:

- todos os menus
- Produção
- Backup
- Usuários

### Gestor

Login:

- gestor@sejalike.com.br

Deve ver:

- relatórios
- auditoria
- fechamento
- análise operacional
- impacto fechamento
- operação de estoque
- baixa
- manutenção

Não deve ver:

- Produção
- Backup
- Usuários

### Operador

Login:

- operador@sejalike.com.br

Deve ver:

- operação de estoque
- cadastros
- materiais
- equipamentos
- manutenção

Não deve ver:

- fechamento
- auditoria
- relatórios
- análise operacional
- impacto fechamento
- baixa definitiva
- Produção
- Backup
- Usuários

### Técnico

Login:

- tecnico@sejalike.com.br

Deve ver:

- operação de estoque
- equipamentos
- consulta/histórico disponível se carregado

Não deve ver:

- cadastros
- materiais
- manutenção
- baixa
- fechamento
- auditoria
- relatórios
- Produção
- Backup
- Usuários

## Limite consciente

A 6D aplica:

- backend forte nas ações críticas
- frontend global nas telas e menus

Algumas RPCs de consulta antiga ainda podem retornar informação se chamadas diretamente e se forem apenas leitura. Ações críticas de gravação, admin, backup, produção, usuários, fechamento, baixa e materiais estão protegidas por permissões ou triggers.

## Status

6D concluída.

## Próxima etapa recomendada

6E - Testes reais por usuário e ajuste fino de permissões.

Objetivo:

Entrar manualmente com cada login, confirmar tela por tela o que aparece, ajustar exceções reais da operação e validar que nenhum perfil operacional ficou com permissão demais ou de menos.
