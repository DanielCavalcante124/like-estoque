# UX - Auditoria com modal interno

Data: 2026-06-12

## Objetivo

Remover diálogos nativos do navegador da tela `Auditoria`, substituindo por modal interno integrado ao layout do LIKE Estoque.

## Arquivo alterado

```text
clean/auditoria.js
```

## Alterações principais

Foram removidos do módulo:

```text
confirm()
window.prompt()
```

Substituídos por:

```text
modal interno para confirmar correção guiada de local
modal interno com textarea para fallback de cópia do resumo WhatsApp
```

## Cache-bust

Atualizado em `index-clean.html`:

```text
clean/auditoria.js?v=3
```

## Segurança e banco de dados

Nenhuma alteração de banco foi feita.

RPCs preservadas:

```text
rpc_auditoria_divergencias_5v1
rpc_corrigir_local_divergente_5v21
```

## Validação técnica

Validação local de sintaxe:

```text
node --check clean/auditoria.js
```

Resultado:

```text
Sem erro de sintaxe.
```

Busca posterior no GitHub:

```text
alert confirm prompt auditoria.js
```

Resultado relevante:

```text
Nenhuma ocorrência em clean/auditoria.js.
Somente documentação antiga apareceu.
```

## Teste recomendado

Após Ctrl+F5, validar:

```text
1. Abrir Auditoria.
2. Gerar auditoria.
3. Copiar resumo WhatsApp.
4. Baixar CSV.
5. Baixar PDF jsPDF.
6. Selecionar uma divergência de local.
7. Clicar em Corrigir local selecionado.
8. Confirmar que aparece modal interno, não caixa nativa do navegador.
9. Cancelar o modal se não for uma correção real segura.
```

## Observação importante

Esta etapa não alterou performance, paginação nem versão da RPC da Auditoria. A melhoria foi somente UX segura, seguindo o padrão aprovado em Fechamento e Usuários.

## Próximo alvo possível

```text
limpeza visual dos textos antigos do index-clean.html
ou padronização de imports/cache-bust internos
```
