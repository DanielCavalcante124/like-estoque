# Entrega 6F - Ajuste fino pós-teste real

Data: 2026-06-08

## Objetivo

Corrigir problemas encontrados durante os testes reais por perfil, principalmente conflitos entre a matriz nova de permissões e policies antigas de RLS.

Problema real identificado:

- gestor conseguia ver/abrir a aba Técnicos
- mas os dados não carregavam
- causa: RLS antiga usando app_has_perfil com lista fixa sem gestor

## Causa técnica

A matriz 6D liberava o menu corretamente pelo frontend.

Porém algumas tabelas ainda tinham policies antigas como:

- app_has_perfil(['admin','estoque','suporte','consulta','tecnico'])

Essas listas não continham:

- gestor
- operador

Resultado:

- menu aparecia
- consulta no banco voltava vazia

## Código impactado

A página de Cadastros e a aba Técnicos usam leitura direta com table(...), principalmente em:

- modelos
- tecnicos
- locais
- produto_tipos
- produto_marcas
- equipamentos
- materiais_saldos
- movimentos
- materiais_movimentos

## Correções aplicadas

### 1. Correção inicial da aba Técnicos

Migration:

- corrigir_rls_leitura_tecnicos_gestor_6e

Corrigiu leitura para:

- tecnicos
- equipamentos
- materiais_saldos
- movimentos
- materiais_movimentos

### 2. Correção ampla de leituras de cadastro/operação

Migration:

- ajuste_fino_rls_leituras_cadastros_6f

Atualizou as policies de SELECT para usar:

- app_has_permission()

Tabelas corrigidas:

- modelos
- locais
- produto_tipos
- produto_marcas
- pendencias_tecnico
- inventario
- descartes_autorizados
- audit_log

## Diagnóstico criado

### public.rpc_diagnostico_policies_antigas_6f()

Criada para admin detectar policies antigas que ainda usam:

- app_has_perfil

Retorna:

- policies_antigas
- select_antigas
- gravacao_antigas
- lista das policies antigas

Resultado após correção:

- select_antigas = 0
- gravacao_antigas = 12
- policies_antigas = 12

Interpretação:

- leituras antigas conflitantes foram removidas
- ainda existem policies antigas de gravação direta
- não foram abertas nesta etapa por segurança, porque a maioria das gravações do frontend limpo passa por RPCs

### public.rpc_diagnostico_leitura_perfil_6f()

Criada inicialmente para diagnóstico de contagens.

Depois foi corrigida para ficar restrita a admin e deixar claro que é visão técnica global, não prova de RLS visual do usuário final.

Motivo:

- funções SECURITY DEFINER podem ver dados com privilégio do dono
- isso não deve ser confundido com RLS real do usuário final

## Validação RLS real por perfil

A validação real foi feita por consulta direta simulando o JWT de cada usuário.

### Gestor

Perfil:

- gestor

Leituras retornadas:

- modelos = 6
- tecnicos = 4
- locais = 8
- produto_tipos = 7
- produto_marcas = 10
- equipamentos = 17
- materiais_saldos = 9
- movimentos = 145
- materiais_movimentos = 16

Resultado:

- gestor corrigido
- aba Técnicos e cadastros devem carregar dados

### Operador

Perfil:

- operador

Leituras retornadas:

- modelos = 6
- tecnicos = 4
- locais = 8
- produto_tipos = 7
- produto_marcas = 10
- equipamentos = 17
- materiais_saldos = 9
- movimentos = 145
- materiais_movimentos = 16

Resultado:

- operador possui leitura operacional coerente com matriz 6D

### Técnico

Perfil:

- tecnico

Leituras retornadas:

- modelos = 6
- tecnicos = 4
- locais = 8
- produto_tipos = 7
- produto_marcas = 10
- equipamentos = 17
- movimentos = 145
- materiais_saldos = 0
- materiais_movimentos = 0

Resultado:

- técnico não lê materiais, coerente com matriz 6D
- técnico ainda lê informações necessárias para operação/equipamentos

## Decisão sobre gravações antigas

O diagnóstico ainda mostra 12 policies antigas de gravação direta com app_has_perfil.

Não foram abertas nesta etapa.

Motivo:

- abrir escrita direta em tabela pode aumentar risco
- o frontend limpo usa RPCs para cadastros e operações críticas
- as triggers 6D já bloqueiam ações críticas como baixa, fechamento e materiais

Decisão correta:

- manter escrita direta conservadora
- migrar gravações antigas apenas se algum fluxo real falhar

## Status

6F concluída.

## Como testar

Abrir:

/index-clean.html?v=6f-ajuste-rls

### Gestor

Login:

- gestor@sejalike.com.br

Testar:

1. Abrir Técnicos.
2. Confirmar que lista técnicos aparece.
3. Confirmar KPIs e dados carregam.
4. Abrir Cadastros.
5. Confirmar modelos, técnicos e locais carregam.

### Operador

Login:

- operador@sejalike.com.br

Testar:

1. Abrir Cadastros.
2. Confirmar modelos/técnicos/locais.
3. Abrir Materiais e Equipamentos.
4. Confirmar carregamento.

### Técnico

Login:

- tecnico@sejalike.com.br

Testar:

1. Confirmar que não vê Materiais.
2. Confirmar que Equipamentos/Operação carregam.
3. Confirmar que não vê Fechamento, Backup, Produção e Usuários.

## Próxima etapa recomendada

6G - Revisão final de produção e empacotamento da versão estável.

Objetivo:

Consolidar o sistema como versão operacional estável, revisar cache final, documentar link oficial, checklist de uso diário e procedimento de suporte.
