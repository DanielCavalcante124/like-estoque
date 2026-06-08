# Correcao - Alerta MAC/SN em cameras no relatorio gerencial

Data: 2026-06-08

## Problema

Na tela de Relatorios, a area de alertas prioritarios indicava que cameras precisavam de MAC/SN.

Isso estava incorreto porque existem patrimonios que nao exigem identificacao MAC/SN, como cameras.

## Diagnostico

Foi confirmado no banco que o modelo:

- Tipo: Camera
- Marca: Mercusys
- Modelo: centr

esta cadastrado corretamente com:

- exige_mac_sn = false

Ou seja, a regra do cadastro estava correta.

O erro estava na RPC:

- public.rpc_relatorio_gerencial_5v

A RPC contava qualquer equipamento ativo sem MAC/SN como alerta, sem validar se o modelo exigia MAC/SN.

## Correcao aplicada

A RPC foi atualizada para criar uma base de equipamentos com a referencia do modelo:

- exige_mac_sn_ref

E o alerta de MAC/SN passou a considerar somente equipamentos cujo modelo exige MAC/SN:

- exige_mac_sn_ref = true
- mac vazio
- serial vazio

## Resultado validado

Apos a correcao:

- sem_mac_sn_corrigido = 0
- alertas.equipamentos_sem_mac_sn = []

As cameras continuam podendo existir sem MAC/SN porque o modelo delas nao exige identificacao.

## Observacao

A tela pode continuar exibindo o card geral de "Equipamentos sem MAC/SN", mas ele deve aparecer zerado quando nao houver equipamento que realmente exija MAC/SN pendente.

## Status

Corrigido.
