# 03: Editar número da versão

**What to build:** Administrador e Integrante editam o número de qualquer versão (histórica, piloto, em sequência, a dada pela plataforma e a aprovada) pelo "⋯" ao lado do rótulo, com o processo em andamento. Só o número muda, nunca o tipo. A janela "Editar número da V{n}" mostra a prévia do rótulo e dos nomes novos dos arquivos; ao gravar, os arquivos no Drive ganham o nome com o número novo (tudo ou nada) e o histórico guarda "Alterou o número da V7 para V5". Regras na seção "Travas em avisos" da spec de `documentos-versoes` (Editar número da versão, histórias 150 a 154 e 158 a 166; decisões 1 a 4) e no ADR 0028. Os avisos amarelos ficam para o ticket 04.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Teste pgTAP antes da migração, um por linha da tabela de regras e por célula nova de "quem pode o quê" da spec: função nova (sem `security definer`) que troca o número com o número esperado; recusa Consulta, inativo e visitante; recusa processo suspenso, cancelado, concluído e arquivado; recusa número repetido (`versoes_numero_unico`) e número esperado errado; tipo nunca muda; nome guardado de fluxogramas, relatórios ligados e .pdf da aprovação acompanha o rótulo (relatório ligado a outra versão não); versão aprovada aceita o número novo e continua sem substituição de arquivo; um evento por edição, com antes e depois. `27_versoes`, o da aprovação, `10_privilegios_padrao` e `46_funcoes_e_views_seguras` continuam passando.
- [x] Migração não destrutiva, aplicada no desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; tipos atualizados.
- [x] Função do servidor `arquivos-no-drive`, ação `renumerar`: confere quem pede e a situação, a entrada, o número esperado e o repetido antes de tocar o Drive; renomeia (com a conferência de pasta do `baixar`) os arquivos que levam o rótulo; grava no banco com o token de quem pediu; se algo falha, devolve os nomes antigos; se a volta também falha, a resposta diz que repetir a edição corrige. Arquivo puro de decisão com teste por perfil e situação; conferência do registro e com o Drive aceitam o nome novo.
- [x] Módulo de versões ganha `editarNumero(versao, numeroEsperado, numeroNovo)`, com teste do módulo real (cliente e `fetch` simulados) e falsa nomeada imitando as recusas e a falha do Drive.
- [x] "⋯" com o item **Editar número** ao lado do rótulo, no destaque e nas "Versões anteriores", reaproveitando o `MenuDeAcoes`; Consulta e processo fora de andamento sem o "⋯".
- [x] Janela com o campo do número (preenchido com o atual), prévia do rótulo e dos nomes novos, [Gravar] desabilitado com número igual ou inválido; "Renomeando os arquivos no Drive…" com os campos travados; recusas com as frases da spec e o número digitado mantido; ao gravar, fecha e relê as versões.
- [x] Versão mais recente, relatório que vale e próxima versão em sequência seguem o número novo; subprocesso com os próprios números.
- [x] Histórico mostra "Alterou o número da V{antes} para V{depois}", com quem e quando.
- [x] Passo do usuário anotado: publicar de novo `arquivos-no-drive` no desenvolvimento e provar a renomeação no Drive real (abaixo).
- [ ] `[visual]` O "⋯" fica ao lado do rótulo sem empurrar a linha dos arquivos. (Não conferido na tela: a execução em paralelo não tinha o app aberto com login. A linha do rótulo é um `flex` com `align-items: center`; conferir a olho.)

## Passo do usuário (função do servidor)

O código da ação `renumerar` está no repositório, mas **a função publicada no Supabase ainda é a antiga**. Antes de usar a edição na tela de verdade:

1. No seu terminal, com o vínculo conferido (`supabase/AMBIENTES.md`): `npx supabase functions deploy arquivos-no-drive --use-api` (projeto de desenvolvimento).
2. Prova no Drive real: numa versão de teste, abrir o "⋯" → Editar número, trocar o número, gravar e conferir no Drive compartilhado que os arquivos da versão (e o .pdf da aprovação, se houver) ganharam o número novo no nome. Depois voltar ao número original.

## Registros da execução

- O Docker não sobe nesta máquina (falta o WSL): o pgTAP rodou só no workflow "Testes de banco" (65: 53 ok; 27, 30, 46, 60 passam). O único reprovado da bateria foi o `59_trava_de_arquivos`, que é do ticket 01 (tira a trava de arquivos).
- A prévia mostra os nomes dos arquivos da versão; o nome do .pdf da aprovação é renomeado, mas não aparece na prévia (o módulo de versões não lê esse nome).
- O .pdf guardado de uma aprovação trocada (histórico) não é renomeado.
