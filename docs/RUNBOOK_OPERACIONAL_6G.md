# RUNBOOK OPERACIONAL 6G - LIKE Estoque

## Link oficial

Use:

- /index-6g.html

Alternativo:

- /index-clean.html?v=6g-estavel

## Acessos

### Admin

Usar para:

- Produção/Healthcheck
- Backup
- Usuários
- Teste perfis
- Ajustes de permissões

### Gestor

Usar para:

- conferência operacional
- relatórios
- auditoria
- fechamento
- correções guiadas

### Operador

Usar para:

- entradas
- saídas
- materiais
- equipamentos
- manutenção operacional permitida

### Técnico

Usar para:

- consulta/uso operacional limitado
- equipamentos
- operação permitida

## Checklist de abertura diária

1. Abrir /index-6g.html.
2. Fazer login.
3. Conferir Dashboard.
4. Conferir se há alertas prioritários.
5. Se houver alerta, abrir Auditoria/Análise operacional com admin ou gestor.
6. Não iniciar correções manuais pelo Supabase sem diagnóstico.

## Checklist de operação

1. Para entrada, usar Entrada individual ou Entrada em lote.
2. Para saída, usar Saída comum ou Operação rápida.
3. Para lote, revisar a tela de conferência antes de confirmar.
4. Gerar comprovante PDF/WhatsApp quando o fluxo oferecer.
5. Não duplicar movimentação para corrigir erro sem antes verificar histórico.

## Checklist de fechamento

1. Conferir relatórios do período.
2. Conferir auditoria operacional.
3. Executar fechamento apenas com perfil admin ou gestor.
4. Se precisar cancelar fechamento, usar cancelamento controlado.
5. Nunca editar fechamento direto no banco.

## Backup diário

1. Entrar como admin.
2. Abrir Backup.
3. Selecionar período.
4. Gerar JSON.
5. Salvar fora do Supabase.
6. Registrar backup executado.
7. Guardar o hash SHA-256.

## Backup semanal

1. Fazer backup completo pelo Supabase Dashboard/CLI.
2. Salvar fora do Supabase.
3. Verificar se o arquivo abre.
4. Executar Healthcheck Produção.
5. Registrar observação operacional.

## Procedimento se o site não abrir

1. Testar /index-6g.html.
2. Testar /index-clean.html?v=6g-estavel.
3. Testar em guia anônima.
4. Limpar cache do navegador.
5. Verificar GitHub Pages.
6. Se GitHub Pages estiver fora, usar plano de contingência com backup JSON e publicação alternativa.

## Procedimento se o banco não responder

1. Parar entradas/saídas críticas.
2. Não criar controles paralelos soltos sem identificação.
3. Registrar movimentações emergenciais em planilha temporária com data, técnico, equipamento, MAC/SN e responsável.
4. Quando voltar, lançar no sistema e gerar comprovantes.
5. Conferir auditoria após regularização.

## Procedimento se perfil não vê dados

1. Confirmar se o menu deve aparecer para o perfil.
2. Se aparece menu mas dados vêm vazios, suspeitar de RLS.
3. Admin deve executar diagnóstico de policies antigas.
4. Corrigir SELECT para app_has_permission().
5. Não liberar escrita direta sem necessidade.

## Procedimento se houver divergência de local

1. Abrir Auditoria.
2. Identificar divergência.
3. Usar correção guiada de local.
4. Evitar update manual no Supabase.
5. Reexecutar auditoria.

## Procedimento se operador fizer erro

1. Não apagar registro direto.
2. Abrir histórico do equipamento.
3. Conferir movimentos.
4. Usar fluxo correto de correção/cancelamento quando existir.
5. Registrar observação clara.

## Procedimento de suporte interno

Ao receber relato de bug:

1. Perfil usado.
2. Tela acessada.
3. Ação executada.
4. Mensagem de erro.
5. Print da tela.
6. Horário aproximado.
7. Se era entrada, saída, devolução, manutenção, baixa, fechamento ou relatório.

## Regra de segurança

Não expor:

- senha
- service role
- token secreto
- chave privada
- acesso admin desnecessário

## Estado da versão

6G é a base estável.

Novas melhorias devem começar em:

- 7A
