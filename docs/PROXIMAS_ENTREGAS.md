# Proximas Entregas

## Entrega 2 - RPCs de equipamentos

Objetivo: mover regras de entrada, saida, devolucao e baixa de equipamentos para o Supabase.

Arquivos previstos:

- supabase/migrations/202606070002_rpc_equipamentos.sql
- src/api/equipamentos.api.js

## Entrega 3 - RPCs de materiais

Objetivo: mover movimentacao de materiais para operacoes transacionais.

Arquivos previstos:

- supabase/migrations/202606070003_rpc_materiais.sql
- src/api/materiais.api.js

## Entrega 4 - RLS por perfil

Objetivo: substituir policies amplas por regras baseadas em user_profiles.

Perfis previstos:

- admin
- estoque
- suporte
- consulta
- tecnico

## Entrega 5 - Refatoracao frontend

Objetivo: reduzir patches globais e separar o app em modulos.

Estrutura alvo:

- src/config
- src/core
- src/api
- src/pages
- src/components
- styles

## Entrega 6 - Windows

Objetivo: criar app Electron depois que banco e frontend estiverem saneados.
