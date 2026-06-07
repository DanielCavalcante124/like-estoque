# Relatorio de Testes - Entregas 1 a 3

Data: 2026-06-07
Branch: refactor/backend-blindagem

## Metodo

Os testes foram executados diretamente no Supabase usando transacoes com ROLLBACK.

Isso significa que as RPCs foram chamadas de verdade, mas os dados de teste foram revertidos ao final.

## Contadores antes dos testes

- equipamentos: 6
- movimentos: 108
- materiais_saldos: 7
- materiais_movimentos: 10

## Testes executados

### Equipamentos

Fluxo testado com rollback:

1. entrada de equipamento
2. saida de equipamento
3. devolucao de equipamento
4. manutencao
5. baixa logica

Resultado: aprovado.

### Materiais

Fluxo testado com rollback:

1. entrada de material
2. saida de material para tecnico
3. baixa de material por uso

Resultado: aprovado.

### Idempotencia de materiais

Foi chamada a mesma operacao de entrada de material duas vezes com o mesmo client_operation_id.

Resultado esperado: apenas um movimento gerado.

Resultado: aprovado.

### Idempotencia de equipamento

O primeiro teste encontrou uma falha: a RPC de entrada de equipamento validava MAC duplicado antes de verificar client_operation_id.

Correção aplicada:

- migration corrigir_idempotencia_entrada_equipamento

Depois da correcao, o mesmo teste passou.

## Contadores finais

- equipamentos: 6
- movimentos: 108
- materiais_saldos: 7
- materiais_movimentos: 10

Conclusao: os testes nao contaminaram o banco.

## Resultado final

Entregas 1, 2 e 3 aprovadas em teste transacional.

Ainda falta teste manual da interface no navegador antes do merge para main.
