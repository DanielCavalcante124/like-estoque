# Entrega 5T.2 - Auditoria de status e filtros

Data: 2026-06-07

## Objetivo

Revisar e corrigir inconsistencias de status e filtros entre banco, movimentos e telas da rota limpa.

## Status atuais em equipamentos

Consulta no banco mostrou status atuais:

- Em estoque
- Com tecnico
- Baixado

## Status encontrados em movimentos

A auditoria de movimentos mostrou tambem:

- Em manutencao
- Aguardando baixa
- Inutilizado
- Descarte autorizado
- Instalado no cliente
- Na rua

## Problema encontrado

Algumas telas usavam comparacao exata de texto, por exemplo:

- status === 'Com tecnico'
- status === 'Em estoque'
- lista fixa de baixados

Isso gerava risco para:

- acentos
- variacoes futuras
- status de manutencao
- status de garantia
- aguardando baixa
- descarte autorizado

## Arquivos corrigidos

- clean/equipamentos.js
- clean/tecnicos.js
- clean/relatorios.js
- index-clean.html

## Correcoes aplicadas

### Equipamentos

- import atualizado para api.js?v=3
- criada normalizacao de status sem acento
- filtro de ativos corrigido
- filtro Em estoque corrigido
- filtro Com tecnico corrigido
- filtro Cliente/rua/reservado corrigido
- novo filtro Manutencao/teste
- novo filtro Garantia
- novo filtro Aguardando baixa
- filtro Baixados/inativos corrigido
- novos KPIs de Manutencao/Garantia e Aguardando baixa

### Tecnicos

- import atualizado para api.js?v=3
- normalizacao de status sem acento
- posse do tecnico agora ignora status sem posse de forma normalizada

### Relatorios

- import atualizado para api.js?v=3
- normalizacao de status sem acento
- relatorio de estoque usa status normalizado
- relatorio por tecnico usa status normalizado
- novo relatorio Manutencao/Garantia
- relatorio de baixas inclui aguardando baixa

## Cache atualizado

index-clean.html agora carrega:

- clean/equipamentos.js?v=2
- clean/tecnicos.js?v=2
- clean/relatorios.js?v=3

## Teste recomendado

Abrir:

/index-clean.html?v=5t2

Testar:

1. Equipamentos > filtro Todos.
2. Equipamentos > filtro Ativos.
3. Equipamentos > filtro Em estoque.
4. Equipamentos > filtro Com tecnico.
5. Equipamentos > filtro Manutencao/teste.
6. Equipamentos > filtro Garantia.
7. Equipamentos > filtro Aguardando baixa.
8. Equipamentos > filtro Baixados/inativos.
9. Tecnicos > filtros Com equipamento, Com material, Com pendencia e Sem posse.
10. Relatorios > Estoque central.
11. Relatorios > Por tecnico.
12. Relatorios > Manutencao/Garantia.
13. Relatorios > Baixas/Aguardando baixa.

## Status

5T.2 concluida.
