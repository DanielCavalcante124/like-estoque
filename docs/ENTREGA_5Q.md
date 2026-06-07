# Entrega 5Q

Baixa controlada / inutilizacao definitiva.

Backend:

- criada rpc_baixar_equipamento_controlado
- rpc_baixar_equipamento agora redireciona para o fluxo controlado

Frontend:

- criado clean/baixa_equipamento.js
- conectado no index-clean.html

Regras principais:

- nao exclui fisicamente o equipamento
- baixa logica com ativo=false
- status final Baixado
- local final Baixado
- exige responsavel
- exige motivo com minimo de 10 caracteres
- usa modal unico de movimentacao em modo critico
- chama RPC, sem update direto no frontend

Testes de backend:

- baixa valida de item preparado para baixa: aprovado
- baixa direta de item em estoque: bloqueada

Teste em:

/index-clean.html?v=5q
