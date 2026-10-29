# Repositório de processos

Status: ready-for-agent

**Enxugar o cartão e o cadastro (mudança de 2026-10-29, spec própria).** A funcionalidade 15, `.scratch/enxugar-cartao-e-cadastro/spec.md` (ADR 0035), recua os níveis da árvore da Lista e lista os arquivos um abaixo do outro, com o nome completo e o ícone do tipo; também enxuga o cadastro, o cartão e o verso. Onde esta spec divergir, vale aquela.

Funcionalidade 14 do `.scratch/projeto.md`. Decisões na sabatina `.scratch/repositorio-de-processos/sabatina.md` (2026-10-28, numeradas de 1 a 20 e citadas aqui como "S1", "S2"…), no ADR 0034 e no `CONTEXT.md` (Concluídos, Tirar do Quadro, Situação do processo, Etiqueta). Demanda de origem: `demanda.md`, na mesma pasta. Muda as specs entregues de `publicacao-e-arquivamento` (fim do Arquivado), `processos-etapas` (Quadro, Lista, visualização por setor, etiqueta), `documentos-versoes` e `revisoes-aprovacao` (as travas "não arquivado"). Cada uma ganhou uma nota apontando para esta spec e a linha `Em revisão desde 2026-10-28`. Onde elas falam em arquivado, arquivar, desarquivar, selo "Arquivado" ou filtro "Arquivados", vale esta spec.

**Como resolve o problema.** Os processos concluídos, com o fluxo e o relatório finais, são o centro de um repositório de processos, mas hoje a plataforma os trata como coisa guardada na gaveta: para tirá-los do Quadro, é preciso **arquivá-los**, o que os trava, põe um selo à parte e cria um filtro para escondê-los. E não há como ver o portfólio organizado, nem os arquivos de cada processo sem abri-lo. Esta mudança separa as visualizações pelo que mostram: o **Quadro por etapa** e o **Quadro por responsável** mostram o trabalho em curso; a **visualização por setor** e a **Lista** mostram o portfólio, com os concluídos sempre presentes e uma escolha à vista entre **Todos** e **Concluídos**. O Arquivado deixa de existir. Na coluna Concluídos do Quadro por etapa, o cartão sai quando alguém o **tira do Quadro** ou sozinho, 30 dias depois de entrar em Concluídos. A Lista ganha **"Agrupar por: Nenhum | Macroprocesso"**, que mostra a mesma tabela em árvore (macroprocesso → setor → processo), com os arquivos da versão mais recente no processo, e passa a filtrar e ordenar pelo cabeçalho de cada coluna. Os cancelados saem de todas as visualizações e aparecem na Lista só quando se pede. Por fim, a etiqueta "Em andamento" passa a se chamar **Iniciado**, para não se confundir com a situação "Em andamento".

## Problema

- Para limpar a coluna Concluídos do Quadro, a equipe precisa **arquivar** cada processo. Arquivar trava o processo (não se move, não muda etiqueta nem responsável, Anotações só para leitura) e o separa na Lista com um selo e um filtro "Arquivados", como se o concluído fosse coisa morta, quando ele é o produto do trabalho do EP.
- Não há como ver o portfólio organizado: quais processos cada macroprocesso tem, em cada setor, e onde estão o fluxo e o relatório de cada um. Para ver os arquivos, é preciso abrir processo por processo.
- A Lista tem uma barra de filtros separada da tabela, e a tabela não se ordena por coluna.
- Os cancelados aparecem misturados na Lista.
- "Em andamento" é ao mesmo tempo uma etiqueta da etapa e uma situação do processo: um processo "em andamento" pode estar com a etiqueta "A fazer".

## Solução

### Trabalho em curso x portfólio (S1, S2)

- **Arquivado deixa de existir:** saem a marca, a trava, o selo "Arquivado", o filtro "Arquivados" e as ações Arquivar e Desarquivar. O processo concluído segue as regras de qualquer concluído (move, muda etiqueta e responsável, Anotações, Registrar publicação, editar revisão e aprovação, .pdf da aprovação, como hoje para o concluído não arquivado). Suspenso e cancelado seguem as regras de qualquer suspenso e cancelado.
- **Quadro por etapa e Quadro por responsável** = trabalho em curso. **Visualização por setor e Lista** = portfólio.

### Coluna Concluídos do Quadro por etapa (S3 a S5)

- A coluna continua sempre, mesmo vazia, como a última. Arrastar até ela conclui o processo, como hoje.
- O cartão fica na coluna até: (a) alguém **Tirar do Quadro**; ou (b) completar **30 dias** desde que o processo entrou em Concluídos.
- Se o processo sair de Concluídos (alguém o move para trás) e voltar depois, o cartão volta à coluna e os 30 dias recomeçam, mesmo que ele já tivesse sido tirado.
- **Tirar do Quadro:** botão no cartão da coluna Concluídos e no verso do processo concluído que ainda está no Quadro, só para Administrador e Integrante do EP. Vale para toda a equipe. Não muda nada no processo e não entra no histórico.
- Logo depois de tirar, um aviso "Tirado do Quadro · Desfazer" aparece por cerca de 8 segundos. Desfazer devolve o cartão à coluna. É o único jeito de desfazer.
- **Pé da coluna Concluídos:** quando há concluídos fora do Quadro, a linha "N concluídos fora do Quadro · Ver na Lista" (singular: "1 concluído fora do Quadro"). "Ver na Lista" abre a Lista em "Concluídos", com os mesmos filtros do Quadro. N respeita os filtros do Quadro.

### Quadro por responsável (S6)

- O processo concluído não aparece, em nenhuma coluna.

### Escolha "Todos | Concluídos" (S7, S9)

- Um par de botões colados, à vista, acima da área: **Todos | Concluídos**. Está na Lista (vale na tabela e na árvore) e no Quadro agrupado por setor. Abre em **Todos**.
- **Todos** na visualização por setor: em andamento, suspensos e concluídos (os concluídos sempre, sem a regra dos 30 dias). Na Lista: em andamento, suspensos e concluídos.
- **Concluídos:** só os processos em Concluídos.

### Cancelados (S8)

- Fora de todas as visualizações (Quadro por etapa, por responsável, por setor e Lista).
- Na Lista, no fim, a linha **"Mostrar cancelados (N)"**, com N contado depois dos filtros. Ao clicar, aparece um bloco "Cancelados" no fim da tabela, com as mesmas colunas; a linha vira "Esconder cancelados". Na árvore, o mesmo bloco fica no fim, fora dos ramos; as colunas Setor e Macroprocesso já dizem o setor e o macroprocesso de cada cancelado. Limite conhecido: se os filtros deixam só cancelados, a tela mostra "Nenhum processo com estes filtros." e a linha "Mostrar cancelados (N)" não aparece.
- Com "Concluídos", a linha não aparece. O filtro da Situação não oferece "Cancelado".

### Etiqueta Iniciado (S10)

- A etiqueta passa a **A fazer · Iniciado · Finalizado**, em todo lugar onde aparece (cartão, verso, lista de escolha, histórico). Só o rótulo muda: o valor no banco continua `em_andamento`, e a cor âmbar continua (ADR 0032). A situação continua "Em andamento". Planilhas e CSV não mostram a etiqueta.

### Lista: cabeçalhos com filtro e ordenação (S18, S19)

- A barra de filtros sai da Lista (continua no Quadro). Acima da tabela ficam a busca pelo nome, **Agrupar por: Nenhum | Macroprocesso**, **Todos | Concluídos** e "Limpar filtros" quando há filtro.
- A coluna "Nome" passa a se chamar **Processo**.
- Cada cabeçalho é um botão que abre um pequeno menu com a ordenação (crescente, decrescente) e, menos em Processo, o filtro de um valor, com "Todos". O cabeçalho mostra quando a coluna está filtrada e em que sentido está ordenada.
- Filtros por coluna: Tipo, Setor, Macroprocesso, Etapa atual, Responsável (com as mesmas opções de hoje) e Situação (Em andamento, Suspenso, Concluído). Com "Concluídos", o filtro da Situação some do cabeçalho.
- Ordenação: Processo, Tipo, Setor (sigla), Macroprocesso e Responsável (sem responsável por último) em ordem alfabética; Etapa atual pela ordem do catálogo; Situação em andamento, suspenso, concluído. Padrão: Processo, crescente. Subprocessos vêm logo depois do processo pai em qualquer ordenação (a Lista antiga ordenava só por setor e nome, e o subprocesso não ficava junto do pai; ver `desvios.md`, ticket 04); o subprocesso cujo pai foi filtrado entra na ordem normal, com o "↳ pai". Sem responsável e sem etapa atual ficam no fim nos dois sentidos; o empate desempata pelo nome.

### Lista: Agrupar por Macroprocesso (S11 a S17)

- **Nenhum:** a tabela de hoje.
- **Macroprocesso:** a mesma tabela, com as mesmas colunas, cabeçalhos, filtros e ordenação, e com linhas de grupo:
  - linha do **macroprocesso** (nome e quantidade de processos), com seta para abrir e fechar;
  - abaixo, linha do **setor** (selo da sigla, nome e quantidade), com seta;
  - abaixo, os **processos** do setor, cada um com uma seta que abre a linha dos arquivos; os **subprocessos** vêm recuados sob o processo pai, mesmo os de outro setor (o selo mostra o setor).
- Os macroprocessos em ordem de nome; os setores pela sigla; os processos pela ordenação escolhida. Ordenar por Setor ou Macroprocesso não muda a árvore.
- Ramos sem processo, depois dos filtros, não aparecem.
- Macroprocessos e setores vêm abertos; processos, fechados. Um botão **Abrir todos / Fechar todos** abre e fecha todos os níveis, inclusive os arquivos de todos os processos.
- Clicar no nome do processo abre o verso, como hoje.
- **Linha dos arquivos** (S12): a versão mais recente, com o rótulo (V7, V6P, V5F) e o selo "Aprovada" quando for a aprovada; um link para cada arquivo dela (.bpm, .png, .bpmn se houver); e o relatório ligado a ela (Relatório V2 .docx, ou o .pdf antigo sem número). Cada link abre o arquivo no Drive, como no verso. Sem miniatura do .png e sem anexos. Sem versão: "Sem versão ainda."

### Endereço da página (S20)

- O agrupamento da Lista (`agrupar=macroprocesso`), a escolha Todos | Concluídos, os filtros e a ordenação ficam no endereço, como os filtros do Quadro hoje. Recarregar ou mandar o link mostra a mesma visão. O que está aberto ou fechado na árvore e o bloco de cancelados não entram no endereço.

### Estados da tela

- **Lista e árvore carregando:** a tabela fantasma de hoje, com o cabeçalho novo.
- **Sem processo nenhum:** a mensagem de hoje. **Nenhum processo com os filtros:** "Nenhum processo com estes filtros." e "Limpar filtros", como hoje (vale também com "Concluídos" e nenhum concluído).
- **Erro ao carregar a Lista** (inclusive falha de conexão): a mensagem de erro de hoje, com "Tentar de novo".
- **Arquivos do processo carregando:** "Carregando arquivos…" na linha dos arquivos. **Erro:** "Não foi possível carregar os arquivos." com "Tentar de novo", sem fechar a linha.
- **Tirar do Quadro e Desfazer recusados ou sem conexão:** o cartão fica onde estava (ou volta), com a mensagem de erro no padrão das ações do Quadro.

## Histórias de usuário

### Trabalho em curso e portfólio

1. Como Integrante do EP, quero que o processo concluído siga editável como qualquer concluído, para não precisar desarquivar nada para corrigir uma etiqueta, um responsável ou as Anotações.
2. Como Integrante do EP, quero que a coluna Concluídos do Quadro mostre os processos que acabaram de ser concluídos, para a equipe ver o que terminou recentemente.
3. Como Integrante do EP, quero tirar do Quadro um cartão da coluna Concluídos, para limpar a coluna quando já não preciso dele à vista.
4. Como Integrante do EP, quero que o cartão saia sozinho da coluna Concluídos depois de 30 dias, para a coluna não crescer sem que ninguém precise cuidar dela.
5. Como Integrante do EP, quero desfazer, no aviso, um Tirar do Quadro feito por engano, para o cartão voltar na hora.
6. Como Integrante do EP, quero que o cartão volte à coluna Concluídos quando o processo sai de Concluídos e volta, para ver de novo o que foi retrabalhado.
7. Como Integrante do EP, quero ver no pé da coluna Concluídos quantos concluídos estão fora do Quadro e ir à Lista com um clique, para saber que eles não sumiram.
8. Como Integrante do EP, quero que o Quadro por responsável não mostre concluídos, para cada coluna mostrar só o que a pessoa tem para fazer.
9. Como Administrador, quero o mesmo Tirar do Quadro que o Integrante do EP.
10. Como Consulta, quero ver a coluna Concluídos e o pé dela sem o botão Tirar do Quadro, porque não altero nada.
11. Como Integrante do EP, quero que tirar um cartão do Quadro o tire para toda a equipe, para a coluna ser a mesma para todos.

### Todos | Concluídos

12. Como Integrante do EP, quero escolher "Concluídos" na Lista, para ver só o portfólio pronto.
13. Como Integrante do EP, quero escolher "Concluídos" na visualização por setor, para ver o que cada setor já tem mapeado.
14. Como Integrante do EP, quero que a tela abra em "Todos", para não estranhar processos faltando.
15. Como Integrante do EP, quero que a visualização por setor mostre sempre os concluídos, mesmo os tirados do Quadro ou com mais de 30 dias, porque ela é o portfólio.
16. Como Integrante do EP, quero que, com "Concluídos", o filtro da Situação suma, para não montar uma combinação que dá Lista vazia.

### Cancelados

17. Como Integrante do EP, quero que os cancelados não apareçam em nenhuma visualização, para o portfólio mostrar só o que vale.
18. Como Integrante do EP, quero mostrar os cancelados no fim da Lista quando precisar, para consultar um cancelado sem que ele atrapalhe o resto.
19. Como Integrante do EP, quero ver quantos cancelados há (com os filtros aplicados) antes de abri-los.
20. Como Integrante do EP, quero que na árvore os cancelados apareçam numa lista à parte, com setor e macroprocesso, para não se misturarem aos ramos.

### Lista com filtro e ordenação por coluna

21. Como Integrante do EP, quero filtrar pelo cabeçalho de cada coluna, para filtrar onde estou olhando.
22. Como Integrante do EP, quero ordenar por qualquer coluna, nos dois sentidos, para achar o que procuro.
23. Como Integrante do EP, quero que a Etapa atual se ordene pela ordem do catálogo, para ver o andamento em sequência.
24. Como Integrante do EP, quero ver no cabeçalho que a coluna está filtrada ou ordenada, para entender a tabela.
25. Como Integrante do EP, quero que a coluna se chame "Processo", para ler a tabela pelo que ela mostra.
26. Como Integrante do EP, quero continuar buscando pelo nome acima da tabela.
27. Como Integrante do EP, quero "Limpar filtros" de uma vez.
28. Como Integrante do EP, quero que filtros, ordenação, agrupamento e Todos | Concluídos fiquem no endereço, para recarregar ou mandar o link sem perder a visão.

### Árvore por macroprocesso

29. Como Integrante do EP, quero agrupar a Lista por macroprocesso, para ver o portfólio em árvore: macroprocesso, setor e processo.
30. Como Integrante do EP, quero que um setor apareça sob cada macroprocesso de que participa com processos.
31. Como Integrante do EP, quero ver os subprocessos sob o processo pai, mesmo os de outro setor, para ler o processo com suas partes.
32. Como Integrante do EP, quero abrir um processo na árvore e ver os arquivos da versão mais recente e o relatório, para pegar o fluxo sem abrir o verso.
33. Como Integrante do EP, quero ver se a versão é a aprovada, pelo selo, para saber se é a oficial.
34. Como Integrante do EP, quero abrir cada arquivo no Drive com um clique.
35. Como Integrante do EP, quero abrir e fechar macroprocessos e setores, e abrir ou fechar tudo de uma vez.
36. Como Integrante do EP, quero que os mesmos filtros, busca e ordenação da tabela valham na árvore, e que ramos vazios não apareçam.
37. Como Consulta, quero ver a árvore e abrir os arquivos, sem editar nada.
38. Como Integrante do EP, quero ver "Carregando arquivos…" e, se falhar, tentar de novo, sem perder a árvore.

### Etiqueta

39. Como Integrante do EP, quero que a etiqueta se chame Iniciado, para não confundi-la com a situação Em andamento.
40. Como Integrante do EP, quero que o histórico antigo também mostre "Iniciado", para ler tudo com os mesmos nomes.

### Dados e histórico

41. Como Integrante do EP, quero que os processos que estavam arquivados voltem ao que eram (concluído, suspenso ou cancelado), sem perder nada, e que os concluídos arquivados continuem fora do Quadro.
42. Como Administrador, quero que as entradas antigas de arquivar e desarquivar continuem no histórico, porque o histórico não se reescreve.

## Decisões de implementação

### Interface

- **Quadro por etapa:** a coluna Concluídos lista os concluídos com `no_quadro` verdadeiro (campo da view, abaixo). O cartão nessa coluna ganha o botão "Tirar do Quadro" para quem altera. O pé da coluna conta os concluídos com `no_quadro` falso que passam pelos filtros do Quadro. "Ver na Lista" leva à Lista com `mostrar=concluidos` e os mesmos filtros.
- **Aviso com Desfazer:** componente novo e pequeno, anunciado para leitores de tela (`role="status"`), com o botão Desfazer focável; some em cerca de 8 segundos ou ao fechar.
- **Verso:** onde hoje ficam Arquivar e Desarquivar (no "Agora" do concluído), fica "Tirar do Quadro", só para o concluído ainda no Quadro e para quem altera. Saem o selo "Arquivado" e todas as frases e bloqueios de arquivado.
- **Quadro por responsável:** os concluídos saem das colunas.
- **Quadro por setor:** ganha o par Todos | Concluídos acima das colunas. As colunas continuam pela regra de hoje (setor ativo mesmo vazio, inativo só com processo). Com Concluídos, cada coluna mostra só os concluídos do setor.
- **Arrastar:** a regra "não arquivado" sai; arrasta-se o cartão do processo em andamento ou concluído, como antes do Arquivado.
- **Lista:** a tabela ganha cabeçalhos com menu (ordenação e filtro), o par Todos | Concluídos, o Agrupar por, o bloco de cancelados e o modo árvore. A tabela e a árvore usam a mesma lista de linhas já filtrada e ordenada; a árvore só acrescenta as linhas de grupo e a linha dos arquivos.
- **Linha dos arquivos:** busca a versão mais recente do processo, os arquivos dela e o relatório ligado, pelas tabelas que o verso já lê, só ao abrir o processo; "Abrir todos" busca de uma vez os arquivos de todos os processos visíveis. Os links usam o mesmo jeito de abrir no Drive do verso.
- **Endereço:** acrescenta `mostrar=concluidos`, `agrupar=macroprocesso` (só na Lista; `agrupar` continua valendo no Quadro para responsável e setor), a ordenação (coluna e sentido) e mantém os filtros de hoje; sai `arquivados`. Endereço antigo com `arquivados=esconder` é ignorado.
- **Rótulos:** etiqueta `em_andamento` = "Iniciado".
- **Edge Function `arquivos-no-drive`:** sai a leitura de `arquivado_em` e a regra "nunca arquivado" do .pdf da aprovação (fica: processo em andamento ou concluído). Precisa ser publicada de novo no desenvolvimento.

### Modelo de dados

Tabela `processos`:

| Coluna | Tipo | Obrigatória | Mudança |
|-|-|-|-|
| `arquivado_em` | timestamptz | não | **sai** (migração destrutiva, abaixo) |
| `tirado_do_quadro_em` | timestamptz | não | **nova**: quando alguém tirou o cartão da coluna Concluídos |

View `processos_com_andamento` (`security_invoker = true`): sai `arquivado_em`; entram `tirado_do_quadro_em` e o campo derivado **`no_quadro`** (boolean), verdadeiro quando o processo está em Concluídos e: não foi tirado depois de entrar em Concluídos (`tirado_do_quadro_em` nulo ou anterior a `entrou_na_etapa_em`) e entrou em Concluídos há menos de 30 dias. Para processo fora de Concluídos, `no_quadro` é verdadeiro (a tela decide pelas outras regras). Derivado, não guardado: sair de Concluídos e voltar recomeça a contagem sem apagar nada.

Funções novas (sem `security definer`: a RLS de `processos` decide quem altera):

- `tirar_do_quadro(p_processo)`: grava `now()` em `tirado_do_quadro_em`. Recusa processo fora de Concluídos (`tirar_do_quadro_so_concluido`) e processo já fora do Quadro (`ja_fora_do_quadro`).
- `voltar_ao_quadro(p_processo)`: o Desfazer; grava nulo em `tirado_do_quadro_em`. Recusa processo fora de Concluídos.
- Nenhuma das duas grava evento no histórico.
- A coluna `tirado_do_quadro_em` só muda por essas funções (como `arquivado_em` hoje, com a liberação de sessão), para ninguém gravá-la direto com outro valor.

Saem: `arquivar_processo`, `desarquivar_processo`, os gatilhos `conferir_arquivamento` e `registrar_evento_do_arquivamento` e as funções deles, `private.liberando_arquivado` e a liberação `ep.liberando_arquivado`, e a trava do arquivado em: `private.conferir_processo_em_andamento`, `private.conferir_processo_arquivado`, `registrar_publicacao` (o ramo `arquivado_ja_publicado`), `private.preparar_anexo`, `private.conferir_processo_do_anexo_retirado` e `editar_numero_da_versao`. Cada uma volta a valer pela regra do processo em andamento ou concluído que já tem.

#### Quem pode o quê (cada célula vira um teste pgTAP)

| Tabela e ação | Administrador | Integrante do EP | Consulta | Usuário desativado | Visitante sem login |
|-|-|-|-|-|-|
| `processos` ler `tirado_do_quadro_em` e `no_quadro` (pela view) | sim | sim | sim | não | não |
| `tirar_do_quadro` (processo em Concluídos, ainda no Quadro) | sim | sim | não | não | não |
| `voltar_ao_quadro` (processo em Concluídos) | sim | sim | não | não | não |
| `processos` gravar `tirado_do_quadro_em` direto, sem as funções | não | não | não | não | não |
| Mover, etiqueta, responsável, Anotações, Registrar publicação e .pdf da aprovação do concluído que estava arquivado | sim | sim | não | não | não |

Sem dado pessoal novo.

#### Regras que o banco impõe

| Regra | Onde | Caso de teste |
|-|-|-|
| Só se tira do Quadro o processo em Concluídos | `tirar_do_quadro` | processo em andamento recusado com `tirar_do_quadro_so_concluido` |
| Não se tira duas vezes | `tirar_do_quadro` | segunda chamada recusada com `ja_fora_do_quadro` |
| `tirado_do_quadro_em` só muda pelas funções | gatilho antes de alterar a coluna | `update` direto recusado, mesmo para Administrador |
| Sair de Concluídos e voltar devolve ao Quadro | `no_quadro` na view | tirar, mover para trás, mover para Concluídos: `no_quadro` verdadeiro |
| 30 dias tiram do Quadro | `no_quadro` na view | passagem em Concluídos com `entrou_em` de 31 dias atrás: falso; de 29 dias: verdadeiro |
| Tirar do Quadro não entra no histórico | ausência de gatilho | depois de tirar, nenhum evento novo do processo |
| O concluído é editável sem arquivado | as funções que perderam a trava | o processo que estava arquivado aceita mover, etiqueta, responsável, Anotações, registrar publicação, anexo e editar número de versão pelas regras de qualquer concluído |

#### Regras de estado

- Concluído: no Quadro (até 30 dias e não tirado) ou fora do Quadro. Fora do Quadro → no Quadro só por Desfazer (`voltar_ao_quadro`) ou por sair de Concluídos e voltar.
- Suspenso e cancelado: sem mudança de regra; não aparecem no Quadro por responsável nem por setor (cancelado) como hoje, e o cancelado sai também da Lista padrão.

#### Migração (destrutiva)

- Uma migração: cria `tirado_do_quadro_em`; copia `arquivado_em` para `tirado_do_quadro_em` nos processos concluídos arquivados, para que continuem fora do Quadro; tira as travas e as funções do arquivado; recria a view; apaga `arquivado_em`.
- Suspensos e cancelados arquivados voltam a ser suspensos e cancelados comuns (a marca some com a coluna).
- Os eventos `arquivar` e `desarquivar` do histórico ficam; a tela do histórico continua sabendo mostrá-los.
- Produção ainda não existe; no desenvolvimento, a migração vai pelo workflow "Migrar banco de desenvolvimento". Os tipos (`database.ts`) são gerados de novo.
- Os testes pgTAP que usam arquivado (49, 50, 52, 53, 55, 60, 61, 62, 65 e os de 39, 41 e 44) mudam junto: o que provava a trava do arquivado sai; o resto continua.

## Decisões de teste

- **Ponto de teste: a tela inteira**, como a pessoa usa: os testes da aplicação montam o app com os módulos falsos de hoje (`ProcessosFalso` e os demais) e agem pela interface (clicar no botão do cabeçalho, escolher "Concluídos", abrir a seta do processo), conferindo o que aparece. Bom teste confere comportamento visível, não a forma interna.
- Antecedentes: `App.listaDosArquivados.test.tsx` (a ser trocado pelos testes de Todos | Concluídos e dos cancelados), os testes do Quadro por setor e do "Agrupar por", e os de filtros da Lista.
- Funções puras, testadas sem tela, onde já existem módulos assim: as colunas do Quadro (concluído fora do Quadro, por responsável sem concluído, por setor com Todos e Concluídos), a ordenação e o filtro por coluna, a montagem da árvore (grupos, ordem, subprocesso sob o pai, ramos vazios) e o endereço (ler e gravar os campos novos, ignorar `arquivados`).
- Banco: pgTAP para cada célula de "Quem pode o quê" e cada regra, inclusive o update direto recusado e os 30 dias (com `entrou_em` ajustado no teste). Os testes antigos do arquivado são retirados ou adaptados, sem perder o que provam do concluído.
- Edge Function: o teste puro de `conferirProcessoDoPdf` passa a provar a regra sem arquivado.

## Fora do escopo

- Miniatura do .png na árvore e anexos na árvore (S12).
- Filtro de vários valores por coluna (S18; dá para trocar depois).
- Agrupar a Lista por outra coisa além de Macroprocesso.
- "Voltar ao Quadro" a qualquer tempo no verso (S4: só o Desfazer do aviso).
- Tirar do Quadro em lote.
- Mudar o limite de 30 dias pela tela.
- Mudanças nas planilhas dos dashboards e no CSV (o arquivado não aparecia neles).

## Decisões tomadas ao escrever esta spec, a confirmar na leitura

- **Subprocesso cujo pai não passa nos filtros:** aparece sob o seu próprio setor, no macroprocesso do pai, com a indicação "subprocesso de <pai>".
- **O aviso com Desfazer dura cerca de 8 segundos.**
- **Concluídos tirados do Quadro antes da migração:** os concluídos arquivados ficam fora do Quadro (a data do arquivamento vira a de Tirar do Quadro).
- **"Ver na Lista" leva os filtros do Quadro.**

## Critérios de aceite que se conferem olhando a tela

1. [visual] O par Todos | Concluídos é bem visível, em botões colados, acima da Lista e do Quadro por setor, com a opção escolhida destacada.
2. [visual] O botão "Tirar do Quadro" no cartão da coluna Concluídos não disputa espaço com o nome nem com a faixa do setor, e é alcançável pelo teclado.
3. [visual] O pé da coluna Concluídos é discreto e legível.
4. [visual] O aviso "Tirado do Quadro · Desfazer" aparece sem cobrir o cartão nem a coluna.
5. [visual] O cabeçalho da coluna mostra o filtro aplicado e o sentido da ordenação de modo claro, e o menu abre sem sair da tela em 1366×768.
6. [visual] Na árvore, as linhas de macroprocesso e de setor se distinguem das de processo, os subprocessos aparecem recuados e a linha dos arquivos lê-se como parte do processo acima dela.
7. [visual] O bloco "Cancelados" no fim da Lista se distingue do resto.
8. [visual] A etiqueta "Iniciado" cabe no cartão como cabia "Em andamento".

Entregue em 2026-10-29 (commit 9fc0201), com ressalva: critérios [visual] de repositorio-de-processos presumidos (nada visto com o login real; a árvore e o cabeçalho da Lista só na vitrine local com módulos falsos, sem captura de imagem); revisão de segurança foi a de reserva (menos completa: o /security-review não achou mudanças a revisar); migrações fim_do_arquivado e tirar_e_voltar_ao_quadro ainda sem aplicar no remoto de desenvolvimento e função arquivos-no-drive sem nova publicação; as ressalvas das entregas anteriores seguem valendo

Em revisão desde 2026-10-29
