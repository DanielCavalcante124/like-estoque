# Modelagem - Confirmar instalação

Data: 2026-06-12

## Regra oficial

Na confirmação de instalação:

```text
status = Instalado cliente
local = Cliente final
cliente_atual = cliente informado
os_atual = OS informada
```

## Banco

Migration aplicada:

```text
modelagem_confirmar_instalacao_cliente_final_20260612_v3
```

A migration registrou comentário oficial na função:

```text
rpc_confirmar_instalacao_cliente
```

## Validação

Resultado validado por catálogo:

```text
still_uses_cliente_as_local = false
sets_local_cliente_final = true
keeps_cliente_atual = true
keeps_os_atual = true
has_stock_assert = true
keeps_idempotency = true
keeps_audit_log = true
authenticated_execute = true
anon_execute = false
public_execute = false
```

## Decisão técnica

O campo `local` deve representar local operacional cadastrado.

O cliente informado deve ficar em `cliente_atual`.

A Auditoria continua validando `local` contra a tabela `locais`.

## Motivo

Evita falso apontamento de local inválido após instalação.

Preserva segurança, rastreabilidade e estabilidade.
