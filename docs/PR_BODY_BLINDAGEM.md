# Pull Request: Blindagem do estoque antes do Windows

## Resumo

Este PR leva para a main os ajustes de frontend preparados para o banco blindado no Supabase.

## Principais mudancas

- app.js passa a usar RPCs de equipamentos.
- materiais_main.js passa a usar RPCs transacionais de materiais.
- Antigo fluxo de excluir equipamento vira baixa logica.
- Fluxos criticos passam a enviar client_operation_id.
- Documentacao tecnica das entregas foi adicionada.

## Banco Supabase ja aplicado

- Backup logico interno.
- Campos de baixa logica.
- client_operation_id.
- RPCs de equipamentos.
- RPCs de materiais.
- RLS por perfil.
- Hardening de funcoes.
- Bloqueio de anon/public em RPCs sensiveis.

## Testes realizados no Supabase

- Admin movimenta estoque com rollback.
- Consulta e bloqueado para movimentar.
- Anon e bloqueado nas RPCs sensiveis.
- Policies antigas permissivas foram removidas.
- Contadores finais nao foram alterados.

## Checklist antes do merge

- Login com estoque@sejalike.com.br.
- Dashboard carrega.
- Equipamentos carregam.
- Materiais carregam.
- Entrada de equipamento funciona.
- Saida de equipamento funciona.
- Devolucao funciona.
- Baixa logica funciona.
- Entrada de material funciona.
- Saida para tecnico funciona.
- Baixa por uso funciona.

## Observacao

A branch estava divergida da main, entao este PR deve ser revisado antes do merge para evitar publicar quebra no GitHub Pages.
