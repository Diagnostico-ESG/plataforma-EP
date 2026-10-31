# 03: Linhas no Quadro por etapa, ícone por etapa e "Você" no cartão

**Como resolve a sua parte:** para ver o andamento por setor ou por pessoa, hoje é preciso trocar a visão inteira e perder as colunas das etapas. Este ticket acrescenta o interruptor Linhas, que separa o Quadro por etapa em faixas por setor ou por responsável mantendo as colunas, dá a cada etapa um ícone para reconhecê-la de relance e mostra "Você" no cartão de quem está na tela.

**What to build:** "Linhas: Nenhuma | Setor | Responsável" no Quadro por etapa, o ícone de cada etapa (pelo código fixo dela, com um genérico para etapa nova) no cabeçalho da coluna, no cabeçalho das etapas das Linhas e na trilha do verso, e "Você" no cartão. Spec: seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`, histórias 12 a 26, 49 a 52, 59 e 60.

**Blocked by:** 01 (o interruptor mora na faixa).

**Status:** ready-for-agent

- [ ] Linhas só aparece no Quadro por etapa; "Nenhuma" é o padrão e mostra o quadro de hoje; a escolha fica no endereço.
- [ ] Só aparecem as linhas com algum cartão depois dos filtros; sem nenhum cartão, vale o vazio dos filtros.
- [ ] Por setor: ordem pela sigla, selo no cabeçalho da linha (nome ao passar o mouse e para o leitor de tela) e contagem; o selo sai dos cartões.
- [ ] Por responsável: ordem alfabética, "Sem responsável" por último, "Você" para a própria pessoa, pílula "Inativo" para quem foi desativado; a linha do responsável sai dos cartões.
- [ ] Cada linha recolhe e abre pela setinha; ao recarregar, todas voltam abertas.
- [ ] As colunas ficam alinhadas entre as linhas, com o cabeçalho das etapas (ícone, nome, contagem) uma vez no alto.
- [ ] Arrastar move entre colunas da mesma linha; soltar em outra linha não muda nada e mostra "Solte o cartão na mesma linha."; a coluna Concluídos aparece nas linhas, com os 30 dias e o Tirar do Quadro.
- [ ] O processo movido continua na mesma linha por setor e, por responsável, vai para a linha do responsável inicial do destino (ou Sem responsável).
- [ ] Cada etapa fixa ou com campos próprios tem o seu ícone e uma etapa nova recebe o genérico; o ícone é só enfeite para o leitor de tela.
- [ ] O cartão mostra "Você" quando o responsável é quem está na tela; sem contador de arquivos e sem prazo.
- [ ] Testes de tela para cada item acima; testes de unidade para ler `linhas` do endereço e para o ícone pelo código da etapa.
- [ ] `[visual]` As Linhas seguem a proposta 6 (colunas alinhadas, cabeçalho das etapas uma vez no alto, selo ou avatar no cabeçalho da linha); os ícones das etapas são legíveis no cabeçalho da coluna e na trilha, no traço dos outros ícones.
