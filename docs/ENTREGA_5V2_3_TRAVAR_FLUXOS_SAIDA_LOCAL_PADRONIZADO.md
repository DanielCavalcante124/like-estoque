# Entrega 5V.2.3 - Travar fluxos de saida para gravar local padronizado

Data: 2026-06-08

## Objetivo

Impedir que novas saidas de equipamento gravem locais invalidos como:

- Tecnico
- nome do tecnico
- backup

O objetivo e padronizar os fluxos para evitar que a auditoria volte a apontar divergencia de local.

## Regra oficial

Quando um equipamento for enviado para tecnico:

- status = Com tecnico
- local = Backup tecnico
- tecnico_atual = nome do tecnico

## Backend corrigido

### RPC central corrigida

- public.rpc_registrar_saida_equipamento_core

Agora a RPC padroniza o destino/local conforme o tipo de movimento:

- Com tecnico -> Backup tecnico
- Enviar para rua -> Na rua
- Enviar para manutencao -> Bancada tecnica
- Reservar para OS -> Backup tecnico
- Instalacao cliente -> destino/cliente ou Cliente final

A RPC tambem valida se o destino/local padronizado existe e esta ativo na tabela locais.

### Operacao rapida corrigida

- public.rpc_operacao_rapida_saida_lote

Antes enviava para a core:

- p_destino = Tecnico

Agora envia:

- p_destino = Backup tecnico

Mesmo que algum frontend antigo envie destino errado, a core agora força o local padronizado.

## Frontend corrigido

Arquivo alterado:

- clean/saida_equipamento.js

Alteracoes:

- destinoPadrao('Enviar para tecnico') agora retorna Backup tecnico
- destinoPadrao('Enviar para rua') agora retorna Na rua
- destinoPadrao('Enviar para manutencao') agora retorna Bancada tecnica
- campo saidaDestino ficou readonly
- mensagem da tela informa que destino/local e padronizado pelo sistema
- comprovante usa o local retornado pela RPC

## Cache atualizado

index-clean.html agora carrega:

- clean/saida_equipamento.js?v=4

## Testes executados

### Saida comum com rollback

Foi testada uma saida comum enviando propositalmente:

- p_destino = Tecnico

Resultado dentro da transacao:

- status = Com tecnico
- local = Backup tecnico
- tecnico_atual = TESTE

A transacao foi encerrada com rollback.

### Operacao rapida com rollback

Foi testada uma operacao rapida com equipamento disponivel.

Resultado dentro da transacao:

- status = Com tecnico
- local = Backup tecnico
- tecnico_atual = TESTE

A transacao foi encerrada com rollback.

## Status

5V.2.3 concluida.

## Proxima etapa recomendada

5V.2.4 - Correcao em lote segura das divergencias atuais.

Motivo:

A causa raiz foi travada. Agora e seguro corrigir as 6 divergencias antigas de local invalido sem risco de elas voltarem imediatamente pelos mesmos fluxos.
