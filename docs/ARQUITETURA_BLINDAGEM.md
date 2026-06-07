# Arquitetura de Blindagem

## Principio

O frontend deve ser interface. As regras criticas devem ficar no banco/Supabase.

## Camadas planejadas

1. Frontend
   - telas
   - validacao basica
   - mensagens ao usuario
   - chamadas para RPC

2. Supabase
   - validacao real
   - RLS
   - regras de estoque
   - historico
   - auditoria leve
   - operacoes transacionais

3. Futuro Windows
   - app local
   - cache
   - fila local
   - sincronizacao usando client_operation_id

## Ordem tecnica

1. Blindagem minima do banco
2. RPCs de equipamentos
3. RPCs de materiais
4. RLS por perfil
5. Refatoracao do frontend
6. App Windows

## Regra de armazenamento

Como o limite e 500 MB, o banco deve evitar logs pesados, payloads completos e duplicidade de historico.

Devem permanecer permanentes:

- equipamentos
- movimentos patrimoniais
- saldos atuais
- historico essencial

Devem ser leves:

- audit_log
- registros temporarios
- consultas auxiliares
