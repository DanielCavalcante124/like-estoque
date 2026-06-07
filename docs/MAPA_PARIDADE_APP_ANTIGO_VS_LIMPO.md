# 5J - Mapa de paridade: app antigo vs app limpo

Data: 2026-06-07

## Decisão

Não substituir o `index.html` antigo ainda.

A versão limpa está mais estável, mas ainda não cobre 100% dos fluxos operacionais do app antigo.

## Evidência do app antigo

O `index.html` antigo ainda possui telas dedicadas para:

- Login / Conexão
- Dashboard
- Entrada
- Materiais
- Retorno sem cadastro
- Saída
- Devolução
- Manutenção
- Estoque central
- Estoque por técnico
- Técnicos
- Equipamentos
- Cadastros CRUD
- Histórico

O app antigo também carrega vários patches antigos:

- app.js
- patch27.js
- patch28.js
- patch29.js
- patch30.js
- patch31.js
- patch32.js
- patch33.js
- patch36.js
- tecnicos_main.js
- materiais_main.js
- final_stable.js
- cadastros_rpc_guard.js

## Evidência da versão limpa

A versão limpa atualmente possui:

- Login limpo
- Dashboard limpo
- Cadastros básicos
- Equipamentos
- Materiais
- Técnicos
- Histórico / Relatórios
- Paginação de relatórios
- PDF profissional

Módulos carregados:

- clean/main.js
- clean/dashboard.js
- clean/equipamentos.js
- clean/materiais.js
- clean/tecnicos.js
- clean/relatorios.js

## Matriz de paridade

| Funcionalidade | Existe no antigo | Existe no limpo | Status | Risco | Decisão |
|---|---:|---:|---|---|---|
| Tela de login principal | Sim | Parcial | Falta polir | Alto | Migrar como 5K |
| Salvar URL/chave Supabase | Sim | Sim | Ok | Médio | Revisar UX |
| Login por e-mail/senha | Sim | Sim | Ok | Alto | Manter |
| Estado Online/Offline no menu | Sim | Parcial | Falta melhorar | Médio | Migrar |
| Botão Sair | Sim | Sim | Ok | Médio | Manter |
| Dashboard operacional | Sim | Sim | Melhor no limpo | Baixo | Manter limpo |
| Entrada individual de equipamento | Sim | Parcial | Falta tela dedicada limpa | Alto | Migrar como 5L |
| Entrada em lote MAC/SN | Parcial/necessária | Não | Falta | Alto | Criar como 5M |
| Retorno sem cadastro anterior | Sim | Não | Falta | Alto | Migrar como 5N |
| Saída dedicada | Sim | Parcial | Existe por prompt em Equipamentos | Alto | Criar modal/tela como 5O |
| Devolução dedicada | Sim | Parcial | Existe por prompt em Equipamentos | Alto | Criar modal/tela como 5O |
| Manutenção/Teste | Sim | Não | Falta | Alto | Migrar como 5P |
| Estoque central | Sim | Parcial | Existe em Equipamentos, mas sem tela dedicada | Médio | Melhorar como 5Q |
| Estoque por técnico | Sim | Sim | Melhor no limpo | Baixo | Manter limpo |
| Técnicos | Sim | Sim | Melhor no limpo | Baixo | Manter limpo |
| Materiais | Sim | Sim | Melhor no limpo | Baixo | Manter limpo |
| Equipamentos | Sim | Sim | Melhor no limpo | Baixo | Manter limpo |
| Cadastros CRUD | Sim | Parcial | Desativar Produto/Modelo ainda pendente | Alto | Corrigir como 5R |
| Histórico | Sim | Sim | Melhor no limpo | Baixo | Manter limpo |
| Relatórios com paginação | Não adequado | Sim | Melhor no limpo | Baixo | Manter limpo |
| PDF profissional | Não adequado | Sim | Melhor no limpo | Baixo | Manter limpo |
| Modais profissionais | Não | Não | Falta | Alto | Criar como 5S |
| Fluxos sem prompt | Não | Parcial | Falta | Alto | Substituir prompts |
| Mobile refinado | Parcial | Parcial | Falta polir | Médio | Melhorar antes da troca |

## Tela de login - requisitos para migrar

A tela de login do app principal não deve ser perdida. A versão final limpa precisa ter:

1. Identidade visual LIKE internet.
2. Mensagem clara de acesso restrito.
3. Campos de e-mail e senha.
4. URL e chave Supabase ocultas por padrão.
5. Possibilidade de configurar URL/chave em modo avançado.
6. Salvamento seguro no localStorage como hoje.
7. Recuperação automática de sessão.
8. Indicador Online/Offline.
9. Botão Sair funcional.
10. Mensagens de erro amigáveis.
11. Layout responsivo para celular.
12. Sem expor informações sensíveis além da chave pública permitida.

## Prioridade de migração antes de trocar o index.html

### 5K - Login limpo definitivo

Criar tela de login final, com aparência profissional e equivalência com a principal.

### 5L - Entrada limpa de equipamento

Entrada individual com modelo, MAC, SN, patrimônio, custo, fornecedor, NF, responsável, local e observação.

### 5M - Entrada em lote

Entrada múltipla com lista de MAC/SN, validação de duplicidade e resumo antes de confirmar.

### 5N - Retorno sem cadastro

Cadastrar equipamento antigo que voltou da rua sem existir no sistema.

### 5O - Saída e devolução com modal

Remover prompts e criar fluxo visual completo.

### 5P - Manutenção/Teste

Tela para aprovado, reprovado, garantia e inutilização.

### 5Q - Estoque central dedicado

Tela de estoque central com filtros e ações rápidas.

### 5R - Corrigir cadastros Produto/Modelo

Resolver desativação e UX de cadastros de forma definitiva.

### 5S - Modais profissionais

Padronizar todos os fluxos críticos sem prompt.

### 5T - Teste geral e troca

Somente depois disso substituir `index.html`.

## Decisão final

A versão limpa não deve substituir o app antigo agora.

Critério para troca:

- 95% dos fluxos operacionais cobertos.
- Login principal equivalente ou melhor.
- Entrada, retorno, saída, devolução e manutenção funcionais.
- Sem dependência de patches antigos.
- Teste operacional aprovado pelo usuário.
