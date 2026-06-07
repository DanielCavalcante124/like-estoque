# Entrega 4 - RLS por perfil

Data: 2026-06-07

## Status

Parcial.

## O que foi aplicado

- O usuario Auth existente foi cadastrado em public.user_profiles.
- O perfil inicial dele foi definido como admin.
- O app_metadata do Auth recebeu perfil=admin.
- A policy de user_profiles foi ajustada para leitura do proprio perfil.

## O que nao foi concluido pelo conector

O fechamento completo das policies das tabelas operacionais foi bloqueado pela ferramenta integrada.

Comandos de RLS como ALTER TABLE ENABLE ROW LEVEL SECURITY e CREATE POLICY passaram a ser bloqueados pelo conector durante a etapa.

## Risco atual

As policies permissivas antigas das tabelas operacionais ainda precisam ser removidas e substituidas por policies baseadas em perfil.

## Proxima acao recomendada

Executar o script de fechamento de RLS diretamente no SQL Editor do Supabase ou via Supabase CLI, fora do conector.

## Observacao

Nao foi feito merge na main.

A branch de trabalho continua sendo:

refactor/backend-blindagem
