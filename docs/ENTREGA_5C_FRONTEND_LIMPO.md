# Entrega 5C - Frontend limpo

Data: 2026-06-07

## Objetivo

Criar uma versao paralela e limpa do frontend, sem carregar os patches antigos que estavam conflitando entre si.

## Rota criada

- index-clean.html

## Arquivos criados

- clean/styles.css
- clean/api.js
- clean/main.js

## Escopo desta entrega

A versao limpa implementa:

- login no Supabase
- dashboard simples de cadastros
- cadastro de Produto/Modelo via RPC
- cadastro de Tecnico via RPC
- cadastro de Local via RPC
- edicao via RPC
- desativacao logica via RPC

## O que esta versao nao carrega

- patch27.js
- patch28.js
- patch29.js
- patch30.js
- patch31.js
- patch32.js
- patch33.js
- patch36.js
- final_stable.js
- cadastros_rpc_guard.js
- tecnicos_main.js
- materiais_main.js

## Regra importante

A tela limpa nao usa DELETE direto.

Todos os fluxos de cadastro usam:

- rpc_criar_modelo
- rpc_editar_modelo
- rpc_desativar_modelo
- rpc_criar_tecnico
- rpc_editar_tecnico
- rpc_desativar_tecnico
- rpc_criar_local
- rpc_editar_local
- rpc_desativar_local

## Como testar

Abrir no GitHub Pages:

/index-clean.html

Depois testar:

1. Login
2. Aba Cadastros
3. Criar modelo
4. Editar modelo
5. Desativar modelo
6. Criar tecnico
7. Editar tecnico
8. Desativar tecnico
9. Criar local
10. Editar local
11. Desativar local

## Decisao tecnica

Se essa rota funcionar sem erro, o problema esta confirmado nos patches antigos do app principal.

A proxima etapa sera migrar gradualmente o app principal para a arquitetura limpa, em vez de continuar remendando patches.
