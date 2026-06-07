# Checklist do Pull Request - Blindagem antes do Windows

## Antes do merge

- Conferir se o PR nao tem conflito com main.
- Abrir o site/app em ambiente de teste.
- Fazer login com estoque@sejalike.com.br.
- Testar dashboard.
- Testar entrada de equipamento.
- Testar saida de equipamento.
- Testar devolucao.
- Testar baixa logica.
- Testar entrada de material.
- Testar saida de material para tecnico.
- Testar baixa por uso.
- Confirmar que historico foi registrado.

## Nao fazer merge se

- Login falhar.
- Alguma tela principal nao carregar.
- RPC retornar permission denied para admin.
- Materiais deixarem de carregar.
- App apresentar erro de JavaScript no console.

## Depois do merge

- Aguardar GitHub Pages publicar.
- Recarregar o site com Ctrl+F5.
- Fazer logout/login.
- Repetir teste de fluxo minimo.

## Observacao

O banco Supabase ja esta blindado. Este PR leva o frontend da branch para a main.
