# Entrega 5S.2

Dashboard operacional no frontend.

Backend usado:

- rpc_dashboard_operacional

Arquivo alterado:

- clean/dashboard.js
- index-clean.html

Recursos:

- KPIs principais
- distribuicao por status
- distribuicao por local
- alertas de estoque abaixo do minimo
- alertas de equipamento com tecnico ha mais de 7 dias
- alertas de manutencao ha mais de 7 dias
- atalhos operacionais
- entradas recentes
- saidas recentes
- devolucoes recentes
- manutencoes e baixas recentes

Melhoria tecnica:

- remove calculos pesados do frontend
- evita carregamento de tabelas antigas/inexistentes
- usa apenas uma RPC para o resumo do dashboard

Teste em:

/index-clean.html?v=5s2
