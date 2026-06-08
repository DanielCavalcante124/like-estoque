# Entrega 5V.2.2 - Tela de correcao guiada das divergencias de local

Data: 2026-06-08

## Objetivo

Adicionar na tela Auditoria um fluxo guiado para corrigir divergencias de local apontadas pela auditoria 5V.1.

A correcao usa a RPC segura criada na etapa 5V.2.1:

- public.rpc_corrigir_local_divergente_5v21

## Arquivos alterados

- clean/auditoria.js
- index-clean.html

## Recursos adicionados

### Painel de correcao guiada

Foi criado o bloco:

- Correcao guiada - Local invalido

Campos:

- selecionar divergencia de local
- novo local
- responsavel pela correcao
- motivo da correcao

Botoes:

- Corrigir local selecionado
- Limpar selecao
- Ultimo comprovante PDF

### Botao na tabela

Para divergencias da categoria Local invalido, a tabela agora mostra o botao:

- Corrigir local

Ao clicar, a divergencia e carregada automaticamente no painel de correcao.

### Validacoes no frontend

A tela valida:

- divergencia selecionada
- novo local selecionado
- motivo com pelo menos 8 caracteres
- confirmacao antes de chamar a RPC

### Chamada da RPC

A correcao chama:

- rpc_corrigir_local_divergente_5v21

Parametros enviados:

- p_equipamento_id
- p_novo_local
- p_motivo
- p_responsavel
- p_client_operation_id

### Recarregamento automatico

Depois da correcao:

1. guarda o retorno como ultimaCorrecao
2. gera PDF jsPDF da correcao
3. recarrega a auditoria
4. remove a divergencia corrigida da lista, se a correcao foi efetiva

### PDF jsPDF da correcao

A cada correcao bem-sucedida, o sistema baixa um comprovante:

- comprovante_correcao_local_CODIGO_YYYY-MM-DD.pdf

Conteudo:

- LIKE Estoque
- Comprovante de correcao de auditoria - Local
- data/hora
- codigo
- equipamento
- status
- tecnico atual
- local anterior
- local corrigido
- motivo
- movimento_id
- client_operation_id
- assinatura do responsavel
- assinatura de conferencia/auditoria

## Cache atualizado

index-clean.html agora carrega:

- clean/auditoria.js?v=2

## Teste recomendado

Abrir:

/index-clean.html?v=5v2-2-correcao-local

Roteiro:

1. Fazer login.
2. Abrir Auditoria.
3. Conferir divergencias de Local invalido.
4. Clicar Corrigir local em uma divergencia.
5. Conferir se a divergencia aparece no painel de correcao.
6. Conferir se o novo local padrao aparece como Backup tecnico.
7. Informar responsavel.
8. Informar motivo com pelo menos 8 caracteres.
9. Confirmar correcao.
10. Conferir se o PDF jsPDF foi baixado.
11. Conferir se a auditoria recarregou.
12. Conferir se a divergencia corrigida saiu da lista.
13. Conferir Historico do equipamento.

## Observacao operacional

Como a correcao altera dado real, o teste deve ser feito em um item que voce realmente quer corrigir.

Para as 6 divergencias atuais investigadas, a correcao recomendada e:

- novo local = Backup tecnico

Mantendo tecnico_atual como esta.

## Status

5V.2.2 concluida.

## Proxima etapa recomendada

5V.2.3 - Travar fluxos de saida para gravar local padronizado.

Motivo:

Corrigir o dado atual resolve o efeito. Mas para evitar que a divergencia volte, os fluxos de saida devem sempre gravar:

- status = Com tecnico
- local = Backup tecnico
- tecnico_atual = nome do tecnico

Nunca:

- local = Tecnico
- local = nome do tecnico
- local = backup
