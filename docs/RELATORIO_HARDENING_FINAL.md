# Relatorio de Hardening Final

Data: 2026-06-07

## Objetivo

Fechar exposicoes restantes apontadas durante a validacao de RLS e RPCs.

## Alteracoes aplicadas no Supabase

- Revogado EXECUTE herdado de public e anon em funcoes sensiveis.
- Mantido EXECUTE apenas para authenticated nas RPCs usadas pelo app.
- Funcoes internas sensiveis ficaram sem execucao direta por authenticated.
- Fixado search_path das funcoes auxiliares apontadas pelo Advisor.
- Protegida a assinatura legada de rpc_baixar_equipamento(uuid, text).

## Testes executados

- Admin consegue executar entrada e baixa logica com rollback.
- Perfil consulta e bloqueado para movimentar estoque.
- Role anon recebe permission denied para RPC sensivel.
- Policies antigas permissivas continuam ausentes.
- Contadores finais nao mudaram.

## Contadores finais apos testes

- equipamentos: 6
- movimentos: 108
- materiais_saldos: 7
- materiais_movimentos: 10

## Resultado

Hardening funcional aprovado.

## Observacao importante

A branch refactor/backend-blindagem ainda esta atrasada em relacao a main. O merge deve ser feito via Pull Request e revisao controlada, nunca direto sem verificar conflitos.
