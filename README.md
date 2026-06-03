# LIKE Estoque

Sistema de controle de estoque técnico da LIKE internet.

## Status

- Supabase configurado com a estrutura da Fase 2.
- GitHub Pages deve ser ativado em `Settings > Pages`.

## Arquivos principais

- `index.html`: app web.
- `supabase_schema_fase2.sql`: SQL da estrutura do banco.
- `.nojekyll`: evita processamento do GitHub Pages.

## Banco Supabase

Projeto Supabase já identificado:

```text
yuyeyawigbbjtzghkbbr
```

URL do projeto:

```text
https://yuyeyawigbbjtzghkbbr.supabase.co
```

O sistema usa estas tabelas:

- `modelos`
- `tecnicos`
- `locais`
- `equipamentos`
- `movimentos`
- `inventario`

## Como ativar o site

No repositório GitHub:

1. Vá em `Settings`.
2. Vá em `Pages`.
3. Em `Build and deployment`, escolha:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Salve.

Depois acesse o link gerado pelo GitHub Pages.

## Como conectar no app

Na tela `Conexão`, preencha:

- Project URL: `https://yuyeyawigbbjtzghkbbr.supabase.co`
- Anon/Public key: use a publishable key do Supabase
- E-mail: usuário criado em Authentication > Users
- Senha: senha do usuário

Depois clique em `Entrar e carregar`.
