# Continuidade do ChatGPT - LIKE Estoque

Este arquivo existe para impedir perda de contexto quando um chat travar, ficar grande demais ou precisar ser continuado em outro atendimento.

A regra é simples: antes de qualquer alteração no projeto, o novo chat deve ler este arquivo e o arquivo `docs/ai-state.json`.

---

## 1. Como retomar em outro chat

Cole esta mensagem no novo chat:

```text
Você vai continuar o projeto LIKE Estoque.
Antes de responder, leia no GitHub o repositório DanielCavalcante124/like-estoque e use como fonte de verdade estes arquivos:

1. docs/CONTINUIDADE_CHATGPT.md
2. docs/ai-state.json
3. version.json
4. docs/VERSIONAMENTO.md
5. docs/AMBIENTES_FREE.md
6. docs/AMBIENTE_LOCAL_SUPABASE.md, se o assunto for ambiente local

Aja como desenvolvedor full stack sênior. Não faça gambiarra. Não use patch paralelo quando a correção deve ser física no arquivo oficial. Não use prompt()/confirm() do navegador. Não altere banco de produção sem explicar risco, criar migration segura e validar. Preserve histórico, segurança, RLS e integridade do estoque.

Me diga primeiro o estado atual do projeto e depois continue exatamente do ponto onde paramos.
```

---

## 2. Perfil do dono do projeto

- Nome conhecido no projeto: Daniel Cavalcante.
- Idioma: português do Brasil.
- Estilo desejado: direto, técnico, objetivo, sem enrolação.
- O usuário está aprendendo banco de dados, Supabase e GitHub, então precisa de passo a passo claro quando for algo operacional.
- O usuário não quer respostas genéricas nem concordância automática com decisões ruins.
- O usuário quer solução de produção, com visual profissional, segurança e mínimo risco de falha.

---

## 3. Regras rígidas do projeto

### 3.1 Código e arquitetura

- Não criar gambiarra.
- Não criar patch paralelo quando o correto for alterar o arquivo oficial.
- Não criar loader escondido para sobrescrever comportamento.
- Evitar arquivos temporários que fiquem mascarando erro real.
- Preferir alteração física e clara nos módulos oficiais.
- Separar front, API, banco, regras e documentação.
- Sempre preservar histórico de movimentações.

### 3.2 UX e interface

- Não usar `prompt()` ou `confirm()` do navegador.
- Confirmações devem ser feitas em card/modal interno do sistema.
- Mensagens de erro precisam ser claras.
- Botões devem ficar onde fazem sentido no fluxo operacional.
- Evitar botão perdido em categoria errada do menu.

### 3.3 Banco de dados

- Não apagar histórico.
- Não deletar equipamento para corrigir status.
- Usar migrations para DDL.
- Usar RPC quando a operação altera estado crítico.
- Usar `SELECT` para validação sem alterar dados.
- Não executar `UPDATE`, `INSERT`, `DELETE` em produção sem autorização clara.
- Sempre pensar em `ativo`, status, técnico atual, cliente atual, OS e movimentos.

### 3.4 Segurança

- Nunca expor `service_role` no front-end.
- Usar chave pública/publishable/anon no navegador.
- RPCs críticas devem ser executáveis apenas por usuário autenticado.
- Verificar Supabase Advisors após migrations sensíveis.
- Ambiente de teste não deve gravar nas tabelas reais.

---

## 4. Repositório e ambiente

- Repositório: `DanielCavalcante124/like-estoque`
- Supabase project_id: `yuyeyawigbbjtzghkbbr`
- Hospedagem: GitHub Pages + Supabase.
- Front principal: `index-clean.html`
- Redirecionamento antigo: `index.html` aponta para versão limpa.

Arquivos principais:

```text
index-clean.html
clean/api.js
clean/env.js
clean/main.js
clean/version.js
clean/entrada.js
clean/entrada_lote.js
clean/saida_equipamento.js
clean/devolucao_equipamento.js
clean/confirmar_instalacao.js
clean/tecnicos.js
clean/permissoes.js
clean/menu_operacao_fix.js
version.json
CHANGELOG.md
docs/VERSIONAMENTO.md
```

---

## 5. Ambientes

### Produção

- Usa tabelas reais.
- Ambiente padrão do `index-clean.html`.
- Versão atual registrada no momento deste documento: `1.1.7`.

### Teste online / staging

- Acessado por `index-teste.html`.
- Redireciona para `index-clean.html?env=staging`.
- Usa tabelas `teste_` para equipamentos e movimentos.
- Não deve gravar em tabelas reais.

### Local

- Acessado por `index-local.html`.
- Usa Supabase local no PC, geralmente `http://127.0.0.1:54321`.
- Configuração local fica em `like_cfg_v27_local` no navegador.
- Nunca usar `service_role` no front.

---

## 6. Estado funcional atual

### 6.1 Entrada normal

Arquivo: `clean/entrada.js`

- Entrada com MAC e Serial/SN separados.
- Enter no MAC foca Serial/SN.
- Enter no Serial/SN solicita envio.
- Usa confirmação interna, não `prompt()`/`confirm()`.
- Usa RPC `rpc_registrar_entrada_equipamento`.

### 6.2 Entrada em lote

Arquivo: `clean/entrada_lote.js`

- Pré-cadastro de itens em lote.
- Valida duplicidade local e no sistema.
- Usa confirmação interna.
- Usa RPC `rpc_registrar_entrada_equipamento_lote`.

### 6.3 Saída e operação rápida

Arquivos principais:

```text
clean/saida_equipamento.js
clean/operacao_rapida.js
```

- Faz movimentação de saída.
- Gera comprovantes.
- Operação rápida permite carrinho.

### 6.4 Impressão opcional de PDFs

Arquivo: `clean/pdf_actions.js`

- Intercepta `doc.save()` do jsPDF.
- Mantém download automático.
- Mostra painel com:
  - Imprimir agora
  - Baixar novamente
  - Abrir PDF
- Não altera as telas de movimentação.

### 6.5 Confirmar instalação

Arquivo: `clean/confirmar_instalacao.js`

Objetivo:

```text
Equipamento Com técnico / Na rua / Reservado
-> Confirmar instalação
-> Status Instalado cliente
-> Limpa tecnico_atual
-> Grava cliente_atual e os_atual
-> Registra histórico
```

RPCs:

```text
rpc_confirmar_instalacao_cliente
teste_rpc_confirmar_instalacao_cliente
```

Observação importante:

- O botão inicialmente caiu em `Outros` porque `clean/permissoes.js` agrupa menu por lista fixa.
- Foi criado `clean/menu_operacao_fix.js` para mover `Confirmar instalação` para `Operação` depois que o menu é montado.
- Melhor melhoria futura: incorporar `navConfirmarInstalacao` diretamente em `clean/permissoes.js`, em `NAV_RULES` e `CATEGORIES`, para eliminar o fix.

### 6.6 Tela Técnicos / cobrança WhatsApp

Arquivo: `clean/tecnicos.js`

Existe tela de técnicos que lista:

- equipamentos em posse;
- materiais em posse;
- valor de patrimônio;
- pendências;
- histórico recente.

Foi adicionado botão:

```text
Copiar cobrança WhatsApp
```

Ele gera mensagem cobrando equipamentos e materiais em posse do técnico, pedindo retorno sobre:

1. o que foi instalado, com cliente/endereço e OS;
2. o que ainda está com o técnico;
3. o que será devolvido;
4. item perdido, danificado ou sem identificação.

O botão antigo `Copiar resumo` foi preservado.

---

## 7. Validações recentes

### Cobrança WhatsApp

Validação sem alteração de registros:

- Produção carrega `clean/tecnicos.js?v=3`.
- Botão `Copiar cobrança WhatsApp` existe.
- Botão `Copiar resumo` foi mantido.
- A mensagem usa clipboard e fallback em `textarea`, sem `prompt()`.
- Colunas principais existem.
- Havia no momento da validação:
  - 11 técnicos cadastrados;
  - 5 equipamentos em posse;
  - 2 materiais em posse;
  - 4 técnicos com equipamento;
  - 2 técnicos com material.

### Menu Confirmar instalação

Validação:

- `clean/menu_operacao_fix.js` carrega depois de `clean/permissoes.js`.
- Ele move `navConfirmarInstalacao` para `sideGroupItems-operacao`.

---

## 8. Padrão de versionamento

Fonte principal: `version.json` e `docs/VERSIONAMENTO.md`.

Regras:

- MAJOR: mudança grande, quebra compatibilidade ou reestruturação crítica.
- MINOR: funcionalidade nova sem quebra.
- PATCH: correção pequena ou ajuste visual.

Ao alterar produção:

1. atualizar arquivo real;
2. atualizar cache-bust no `index-clean.html` quando necessário;
3. atualizar `version.json` quando a mudança for relevante;
4. registrar em documentação se for mudança de processo ou arquitetura;
5. testar com leitura e, se necessário, ambiente de teste.

---

## 9. O que evitar em novos chats

- Não recomeçar sistema do zero sem necessidade.
- Não criar patch tipo `fix_final`, `patch27`, `guard`, `loader`.
- Não sobrescrever tela inteira sem entender dependências.
- Não mexer em banco de produção para testar ideia.
- Não trocar Supabase por outra solução sem motivo técnico forte.
- Não remover histórico.
- Não criar controle de kit, pois o usuário já recusou essa ideia.

---

## 10. Melhorias futuras recomendadas

1. Incorporar `Confirmar instalação` diretamente em `clean/permissoes.js`, removendo `menu_operacao_fix.js`.
2. Criar uma tela de pendências por técnico com idade da pendência.
3. Criar níveis de cobrança:
   - amigável;
   - formal;
   - gestor.
4. Registrar log de cobrança sem alterar estoque, em tabela própria futura, se o usuário aprovar.
5. Criar migrations completas para ambiente local Supabase.
6. Atualizar textos antigos do `index-clean.html` que ainda mencionam patches antigos.
7. Padronizar imports para a versão mais recente de `api.js` e `env.js`.

---

## 11. Check-list antes de qualquer mudança

Antes de alterar produção:

```text
1. Entender a regra de negócio.
2. Verificar se já existe função parecida.
3. Preferir arquivo oficial em vez de patch.
4. Verificar colunas reais no Supabase com SELECT.
5. Evitar escrita no banco durante validação.
6. Se alterar banco, usar migration.
7. Se alterar front, atualizar cache-bust.
8. Testar sem quebrar fluxo existente.
9. Informar exatamente o que mudou.
10. Registrar no versionamento quando fizer sentido.
```
