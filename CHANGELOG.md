# CHANGELOG - LIKE Estoque

Todas as alterações relevantes do sistema devem ser registradas neste arquivo.

Formato adotado: versionamento semântico.

- `MAJOR`: mudança grande, quebra de compatibilidade ou reestruturação crítica.
- `MINOR`: nova funcionalidade ou reestruturação sem quebrar uso normal.
- `PATCH`: correção pequena, ajuste visual ou melhoria pontual.

---

## [1.1.1] - 2026-06-09

### Alterado

- Incorporada a desativação de modelo, técnico e local diretamente no módulo oficial `clean/main.js`.
- O fluxo de desativação agora usa card interno com motivo obrigatório, sem caixa nativa do navegador.
- Atualizado cache do `index-clean.html` para carregar `clean/main.js?v=7` e `clean/version.js?v=2`.

### Removido

- Removido definitivamente o carregamento de `clean/desativar-modelo-fix.js`.
- Removido o arquivo `clean/desativar-modelo-fix.js` do repositório.
- Removido uso de caixa nativa para desativação em cadastros.

### Segurança operacional

- Desativação agora exige motivo com no mínimo 6 caracteres.
- Histórico continua preservado via RPC oficial.
- Fluxo de cadastro deixa de depender de arquivo de contorno.

---

## [1.1.0] - 2026-06-09

### Adicionado

- Criado controle formal de versão do sistema por `version.json`.
- Criado changelog oficial do projeto.
- Criada documentação de processo de versionamento.
- Criado módulo visual de versão para exibição dentro do app.

### Alterado

- Reestruturado fisicamente o módulo `clean/entrada.js`.
- Reestruturado fisicamente o módulo `clean/entrada_lote.js`.
- Atualizado cache do `index-clean.html` para carregar `entrada.js?v=5` e `entrada_lote.js?v=5`.
- Entrada individual agora usa conferência em tela antes de gravar.
- Entrada em lote agora usa fluxo nativo MAC -> Serial/SN -> pré-entrada automática -> volta para MAC.
- Comprovantes e tabelas passaram a exibir MAC e Serial/SN separadamente.

### Removido

- Removido carregamento externo de patches de entrada pelo `desativar-modelo-fix.js`.
- Removido arquivo externo `clean/entrada_fluxo_seguro.js`.
- Removido arquivo externo `clean/entrada_normal_confirmacao.js`.

### Segurança operacional

- Reduzido risco de cadastro acidental sem conferência.
- Reduzido risco de serial não visualizado por estar misturado com MAC.
- Mantido uso das RPCs existentes sem alteração no banco nesta versão.

---

## [1.0.0] - Base inicial

### Base

- Sistema LIKE Estoque em GitHub Pages + Supabase.
- Controle de equipamentos patrimoniais.
- Entrada individual.
- Entrada em lote.
- Saída de equipamentos.
- Devolução.
- Manutenção.
- Baixa controlada.
- Materiais.
- Técnicos.
- Auditoria.
- Fechamento operacional.
- Inventário por bipagem.
- Backup operacional.
- Permissões e usuários.
