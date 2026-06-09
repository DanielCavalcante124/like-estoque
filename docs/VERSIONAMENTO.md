# Processo de Versionamento - LIKE Estoque

Este documento define como o sistema LIKE Estoque deve ser versionado daqui para frente.

## 1. Objetivo

Garantir que toda alteração feita no sistema tenha rastreabilidade, histórico, motivo e versão clara.

Nenhuma mudança operacional importante deve ser feita sem registro em versão.

---

## 2. Arquivos oficiais de versionamento

O projeto passa a usar estes arquivos:

```text
version.json
CHANGELOG.md
docs/VERSIONAMENTO.md
clean/version.js
```

### `version.json`

Guarda a versão atual do sistema.

Deve conter:

- nome do app
- versão atual
- data da release
- ambiente
- resumo da versão
- módulos alterados

### `CHANGELOG.md`

Guarda o histórico técnico e operacional das alterações.

Toda alteração relevante deve ser registrada nele.

### `docs/VERSIONAMENTO.md`

Define as regras de versionamento.

### `clean/version.js`

Exibe a versão atual dentro da interface do sistema.

---

## 3. Padrão de versão

O sistema usa versionamento semântico:

```text
MAJOR.MINOR.PATCH
```

Exemplo:

```text
1.1.0
```

### MAJOR

Use quando houver mudança grande ou risco de quebra operacional.

Exemplos:

- troca de arquitetura
- mudança forte no banco
- alteração profunda nas RPCs
- migração de sistema
- alteração que exige treinamento geral

### MINOR

Use quando houver nova funcionalidade ou reestruturação sem quebrar o uso normal.

Exemplos:

- novo fluxo de entrada
- novo relatório
- nova tela
- melhoria estrutural de módulo
- nova regra operacional

### PATCH

Use para correções pequenas.

Exemplos:

- texto
- ajuste visual
- correção simples
- pequeno bug sem impacto estrutural

---

## 4. Regra para cada alteração

Antes de alterar o sistema, classificar o tipo:

```text
Correção pequena -> PATCH
Nova função ou reestruturação -> MINOR
Mudança crítica ou quebra de compatibilidade -> MAJOR
```

Depois da alteração:

1. Atualizar os arquivos reais do sistema.
2. Atualizar `version.json`.
3. Atualizar `CHANGELOG.md`.
4. Atualizar cache no `index-clean.html`, se algum arquivo JS/CSS mudou.
5. Testar o fluxo alterado.
6. Registrar o que foi testado.

---

## 5. Regra contra gambiarra

Não usar arquivo externo para corrigir fluxo principal.

Patches temporários só podem ser usados em emergência e devem ser removidos depois.

Fluxos críticos devem ser corrigidos no arquivo original:

```text
Entrada individual -> clean/entrada.js
Entrada em lote -> clean/entrada_lote.js
Saída -> clean/saida_equipamento.js
Operação rápida -> clean/operacao_rapida.js
Materiais -> clean/materiais.js
Permissões -> clean/permissoes.js
```

Se a falha for no banco, corrigir a RPC, policy, constraint ou tabela no Supabase.

---

## 6. Checklist antes de publicar

Antes de considerar uma versão pronta:

```text
[ ] Código alterado no arquivo correto
[ ] Sem patch externo desnecessário
[ ] Changelog atualizado
[ ] version.json atualizado
[ ] Cache do index-clean.html atualizado
[ ] Fluxo testado em aba anônima ou Ctrl + F5
[ ] Confirmado que não quebrou fluxo anterior
```

---

## 7. Convenção de nomes de commit

Usar mensagens objetivas:

```text
feat: adiciona nova funcionalidade
fix: corrige bug
refactor: reestrutura sem mudar regra principal
docs: atualiza documentação
chore: manutenção interna
security: ajuste de segurança
```

Exemplos:

```text
refactor: reestrutura entrada individual
feat: adiciona versionamento do sistema
fix: corrige salvamento de serial
security: ajusta policy de movimentacao
```

---

## 8. Versão atual

Versão atual inicial do controle formal:

```text
1.1.0 - entrada-reestruturada
```
