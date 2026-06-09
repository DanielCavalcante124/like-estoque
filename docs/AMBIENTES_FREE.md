# Ambientes no Supabase Free - LIKE Estoque

Este documento define como o LIKE Estoque deve trabalhar com versão de teste e versão de produção usando apenas um projeto Supabase Free.

## 1. Contexto

O projeto utiliza Supabase Free e, no momento, só há um projeto Supabase disponível.

Como não existe um segundo projeto para homologação, o sistema não deve tentar imitar uma estrutura empresarial com múltiplos bancos físicos.

A regra passa a ser:

```text
Produção é o banco real.
Teste não pode gravar em produção sem controle explícito.
```

---

## 2. Ambientes oficiais

O sistema terá dois ambientes de código:

```text
produção -> usado pela operação real
teste    -> usado para validar telas, fluxos e novas regras antes de publicar
```

Com apenas um Supabase Free, existem duas estratégias possíveis.

---

## 3. Estratégia segura inicial

A estratégia segura inicial é:

```text
Produção:
- usa Supabase real
- grava nas tabelas oficiais
- usada pela operação

Teste:
- usa URL separada do site
- exibe aviso visual forte de ambiente de teste
- não deve ser usada pela operação real
- alterações novas devem ser validadas nela antes de irem para produção
```

---

## 4. Regra contra mistura de dados

Nunca usar a versão de teste para movimentar estoque real.

Nunca testar uma rotina nova diretamente em produção.

Se for necessário testar gravação real, usar somente itens fictícios claramente identificados.

Exemplo de prefixo obrigatório para dados de teste:

```text
TESTE - ONT
TESTE - Técnico
TESTE - Local
TESTE - Cliente
```

---

## 5. Estratégia com tabelas de teste

Se for necessário testar gravação sem tocar nas tabelas reais, criar tabelas separadas com prefixo:

```text
teste_modelos
teste_tecnicos
teste_locais
teste_equipamentos
teste_movimentos
```

Essa estratégia deve ser usada com cuidado, porque os módulos atuais usam RPCs e tabelas oficiais.

Antes de ativar essa estratégia, será necessário criar uma camada oficial de ambiente no código.

---

## 6. Camada oficial de ambiente

O sistema deve ter um arquivo oficial de ambiente:

```text
clean/env.js
```

Exemplo:

```javascript
export const APP_ENV = 'production';
```

Na versão de teste:

```javascript
export const APP_ENV = 'staging';
```

O ambiente precisa aparecer visualmente no sistema.

Produção:

```text
LIKE Estoque v1.x.x
```

Teste:

```text
AMBIENTE DE TESTE - NÃO USAR NA OPERAÇÃO
```

---

## 7. Regra para publicação

Toda mudança nova deve seguir este fluxo:

```text
1. Criar mudança na versão de teste
2. Validar visual e fluxo
3. Testar com dados fictícios
4. Atualizar CHANGELOG.md
5. Atualizar version.json
6. Só então publicar na produção
```

---

## 8. O que não fazer

Não criar patch externo para corrigir problema.

Não testar cadastro real usando equipamento real.

Não usar produção como laboratório.

Não criar tabela de teste sem documentar e sem camada de ambiente no código.

Não alterar RPC de produção sem antes entender o impacto.

---

## 9. Modelo recomendado agora

Para o momento atual do LIKE Estoque:

```text
1. Manter produção em v1.1.1.
2. Criar uma página/versão de teste com aviso visual forte.
3. Criar camada clean/env.js.
4. Usar versionamento beta na versão de teste.
5. Só criar tabelas teste_ quando houver necessidade real de testar gravação isolada.
```

Versão de produção:

```text
1.1.1
```

Próxima versão de teste:

```text
1.2.0-beta.1
```

---

## 10. Decisão técnica

Enquanto houver apenas um Supabase Free, a melhor decisão é:

```text
Separar código e visualmente o ambiente primeiro.
Só depois separar dados por tabelas teste_, se necessário.
```

Essa abordagem reduz risco e evita criar uma segunda estrutura de banco mal planejada.
