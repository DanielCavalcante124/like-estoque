# Diagnóstico - Padronização de imports e cache-bust interno

Data: 2026-06-12

## Objetivo

Mapear inconsistências de import interno do `clean/api.js` antes de alterar arquivos JS ativos.

## Situação encontrada

Existem módulos usando versões diferentes do mesmo arquivo:

```text
./api.js?v=3
./api.js?v=5
```

Como módulos ES com query string diferente podem ser tratados como URLs diferentes pelo navegador, isso pode gerar carregamentos duplicados do mesmo módulo.

## Versão oficial atual

A versão oficial do módulo API no versionamento do projeto é:

```text
api: 5
```

Portanto, a direção correta é migrar imports ativos para:

```text
./api.js?v=5
```

## Arquivos encontrados com api.js?v=3

Busca realizada:

```text
"./api.js?v=3"
```

Arquivos relevantes encontrados:

```text
clean/backup.js
clean/auditoria.js
clean/dashboard.js
clean/lotes_saida.js
clean/impacto_fechamento.js
clean/producao.js
clean/relatorios_pdf_js.js
clean/analise_operacional.js
clean/usuarios.js
clean/permissoes.js
```

Também apareceram arquivos legados/não carregados diretamente:

```text
clean/teste_perfis.js
clean/fechamento_impacto.js
```

## Arquivos encontrados com api.js?v=5

Busca realizada:

```text
"./api.js?v=5"
```

Arquivos encontrados:

```text
clean/materiais.js
clean/tecnicos.js
clean/devolucao_equipamento.js
clean/inventario_bip.js
clean/relatorios.js
clean/operacao_rapida.js
clean/inventario_materiais.js
clean/manutencao_equipamento.js
clean/saida_equipamento.js
clean/confirmar_instalacao.js
clean/equipamentos.js
clean/baixa_equipamento.js
clean/retorno_sem_cadastro.js
clean/historico_equipamento.js
```

## Decisão técnica

Não foi aplicada alteração em lote porque alguns arquivos com `api.js?v=3` também têm outras dívidas técnicas, como diálogos nativos do navegador.

Exemplo identificado:

```text
clean/backup.js ainda possui alert()/confirm().
clean/producao.js ainda possui alert()/window.prompt().
```

Misturar padronização de import com troca de UX aumentaria o risco.

## Regra para próxima fase

Migrar em blocos pequenos:

```text
1. Arquivos pequenos e sem dívida UX primeiro.
2. Arquivos grandes ou com alert/confirm/prompt devem virar etapa própria.
3. Alterar apenas o import.
4. Atualizar cache-bust do módulo no index-clean.html.
5. Validar sintaxe.
6. Testar a tela correspondente.
7. Documentar e versionar.
```

## Próxima fase recomendada

Antes de padronizar todos os imports, corrigir UX dos módulos administrativos que ainda usam caixas nativas:

```text
Backup UX
Produção UX
```

Depois disso, padronizar os imports desses módulos para `api.js?v=5` junto com cache-bust próprio.

## Segurança

Nenhuma alteração foi feita em banco.
Nenhuma RPC foi alterada.
Nenhum arquivo JS funcional foi alterado nesta etapa de diagnóstico.
