# Entrega 5K - Login limpo definitivo

Data: 2026-06-07

## Arquivos criados

- clean/login.css
- clean/login.js

## Arquivos alterados

- index-clean.html
- clean/main.js

## Melhorias implementadas

- Tela de login com aparência profissional.
- Identidade visual LIKE internet.
- Mensagem de acesso operacional restrito.
- Campos principais apenas para e-mail e senha.
- URL e chave Supabase escondidas em Configuração avançada.
- Indicador de configuração salva ou pendente.
- Indicador de sessão ativa ou aguardando login.
- Botão para limpar configuração local.
- Senha não é salva pelo sistema.
- Estado Online/Offline no menu lateral.
- main.js mais tolerante a telas dinâmicas da versão limpa.

## Como testar

Abrir:

/index-clean.html?v=5k

1. Conferir se o login aparece com layout novo.
2. Conferir se Configuração avançada fica recolhida quando URL/chave existem.
3. Conferir se e-mail e senha aparecem como campos principais.
4. Clicar em Configuração avançada.
5. Conferir URL e chave.
6. Fazer login.
7. Conferir sessão Online no menu lateral.
8. Clicar em Sair.
9. Conferir retorno para tela de login.

## Status

Implementado na rota limpa.
