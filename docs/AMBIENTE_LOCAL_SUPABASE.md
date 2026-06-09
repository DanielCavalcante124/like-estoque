# Ambiente Local com Supabase no PC

Este documento explica como rodar o LIKE Estoque com Supabase local, sem usar o banco de produção.

## Objetivo

Criar um ambiente seguro para testar alterações pesadas antes de publicar no teste online ou na produção.

Fluxo correto:

```text
local -> staging online -> production
```

---

## 1. Pré-requisitos

Instalar no PC:

```text
Docker Desktop
Node.js LTS
Git
```

Depois reiniciar o computador.

---

## 2. Instalar dependências do projeto

Na pasta do projeto:

```bash
npm install supabase --save-dev
```

---

## 3. Inicializar Supabase local

Na pasta do projeto:

```bash
npx supabase init
```

Depois subir o ambiente:

```bash
npx supabase start
```

Ao finalizar, o terminal vai mostrar:

```text
API URL
anon key
service_role key
Studio URL
```

Use somente:

```text
API URL
anon key
```

Nunca use `service_role key` no front-end.

---

## 4. Abrir o Studio local

Normalmente o Studio local abre em:

```text
http://localhost:54323
```

A API local normalmente fica em:

```text
http://127.0.0.1:54321
```

---

## 5. Abrir o LIKE Estoque local

Abrir no navegador:

```text
index-local.html
```

Informar:

```text
URL local do Supabase
anon key local
```

Depois clicar em:

```text
Salvar e abrir ambiente local
```

O sistema vai abrir:

```text
index-clean.html?env=local
```

---

## 6. Como identificar que está no local

O sistema deve mostrar banner azul:

```text
AMBIENTE LOCAL — Supabase no PC, sem banco de produção
```

E badge:

```text
LOCAL v1.3.0-local.1
```

---

## 7. Separação de configuração

As configurações são separadas por ambiente:

```text
production -> like_cfg_v27_production
staging    -> like_cfg_v27_staging
local      -> like_cfg_v27_local
```

Isso evita que uma chave local contamine a produção.

---

## 8. Regra de segurança

Nunca colocar `service_role key` no navegador.

Nunca apontar o ambiente local para o banco de produção.

Nunca testar movimentação real no local.

---

## 9. Próximo passo técnico

Depois que o Supabase local estiver rodando, é necessário carregar o schema do banco.

Opções:

```text
1. Importar schema exportado do Supabase online
2. Criar migrations locais do projeto
3. Criar banco mínimo de teste para entrada, saída, devolução, manutenção e baixa
```

A melhor opção para o LIKE Estoque é criar migrations versionadas dentro da pasta:

```text
supabase/migrations
```

Assim o banco local fica reproduzível e não depende de cópia manual.
