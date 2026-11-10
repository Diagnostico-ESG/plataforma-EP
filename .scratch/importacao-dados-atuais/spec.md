# Importação dos dados atuais

**Duas revisões (mudança de 2026-11-10, em `revisoes-aprovacao`).** O processo cuja última coluna concluída é "Revisão Interna" passa a entrar na etapa nova Revisão do relatório (a coluna marca as duas revisões). Detalhe na seção "Duas revisões" de `.scratch/revisoes-aprovacao/spec.md`.

Status: ready-for-agent

Decisões de origem: sabatina de 2026-11-05 (`.scratch/importacao-dados-atuais/sabatina.md`, Q1 a Q23; o caso "VII sem data" e a data ilegível do Q9 mudaram no ajuste de 2026-11-06, no fim desta spec), regras de etapa e formato da planilha (`.scratch/importacao-dados-atuais/amostra/cabecalho.md`), ADR 0044 e o termo **Importação dos dados atuais** no `CONTEXT.md`. Valem também os ADRs 0005 a 0008 (versão com os arquivos dentro, arquivos no Drive pela função `arquivos-no-drive`) e 0028 (número da versão).

## Problem Statement

O escritório já mapeou dezenas de processos fora da plataforma: a planilha "Controle de Mapeamentos" (aba PRODUTO 33) diz de que setor e macroprocesso é cada processo e até que fase chegou, e a pasta local DOCUMENTOS MAPEAMENTO guarda os fluxogramas e relatórios de cada versão. Sem a plataforma ter esses dados, a equipe teria de recadastrar tudo à mão, processo por processo e arquivo por arquivo, e a planilha não pode ser descontinuada. A produção só tem login pelo Google, a rede do escritório só abre a porta 443 e os arquivos não podem passar pelo GitHub, então um script local ou um workflow não resolvem.

## Solution

O Administrador abre **Administração → Importação**, escolhe a planilha (primeira entrega) e vê uma prévia do que vai entrar, do que será pulado e do que está fora da regra. Confirma, e a plataforma grava setores, macroprocessos e processos, cada processo já na etapa certa. Depois, na segunda entrega, escolhe a pasta de documentos, vê a prévia das versões e dos relatórios e confirma; os arquivos vão do computador dele para o Drive e ficam ligados às versões. Rodar de novo nunca altera o que já existe: o que se repete é pulado e listado. A tela continua na plataforma depois da carga.

## User Stories

### Acesso à tela

1. Como Administrador, quero uma entrada "Importação" dentro de Administração, para achar a carga no mesmo lugar dos outros cuidados da plataforma.
2. Como Integrante do EP ou Consulta, quero que a Importação não apareça para mim e que o endereço direto não abra nada, para que só o Administrador mexa nos dados em massa.
3. Como Administrador, quero fazer a importação com o meu login Google de sempre, para não precisar de senha nem de acesso especial ao banco.
4. Como Administrador, quero que a tela explique em poucas linhas as duas etapas (planilha, depois arquivos) e em que ordem fazê-las, para não me perder.
5. Como Administrador, quero que a tela continue disponível depois da carga, para importar de novo caso a planilha ganhe linhas novas antes de ser descontinuada.

### Primeira entrega: escolher a planilha e ver a prévia

6. Como Administrador, quero escolher o arquivo da planilha (a aba PRODUTO 33 exportada como .csv) no meu computador, para não depender de nenhuma conexão com o Google Drive dela.
7. Como Administrador, quero que um arquivo que não seja a planilha esperada (colunas faltando ou fora do lugar) seja recusado com a explicação de quais colunas faltam, para não importar lixo.
8. Como Administrador, quero ver, antes de gravar, quantos setores, macroprocessos e processos vão ser criados, para conferir o tamanho da carga.
9. Como Administrador, quero ver na prévia a etapa em que cada processo vai entrar, para conferir a regra da última coluna "Concluído".
10. Como Administrador, quero que a prévia nada grave até eu confirmar, para poder desistir sem deixar rastro.
11. Como Administrador, quero um botão para confirmar a importação, só habilitado quando há algo a gravar, para não confirmar uma carga vazia.
12. Como Administrador, quero que a coluna D (oculta, em branco) seja ignorada sem aviso, para não ver ruído.

### Setores e macroprocessos

13. Como Administrador, quero que cada sigla da coluna Área vire um setor cujo nome é a própria sigla, para completar o nome depois em Cadastros. A sigla com barra ("DAE/CTL", também com espaços em volta da barra) entra com hífen ("DAE-CTL"), porque a plataforma só aceita letras, números e hífen.
14. Como Administrador, quero que um setor que já existe com a mesma sigla seja reaproveitado, para não duplicar setores.
15. Como Administrador, quero que o macroprocesso entre sem o numeral romano e sem o " - " ("II - Orçamentário" vira "Orçamentário"), para seguir os nomes da plataforma.
16. Como Administrador, quero que "Subprocesso Geral", "Subprocesso de eventos", "DL - DIRETOR LEGISLATIVO" e as células em branco entrem em **A definir**, para não inventar macroprocessos que não existem.
17. Como Administrador, quero que "A definir" seja um macroprocesso comum, criado pela importação, com os setores que aparecerem nele, para poder reclassificar depois pela tela de Cadastros.
18. Como Administrador, quero que o macroprocesso que já existe no setor seja reaproveitado, para não duplicar.

### Processos e etapas

19. Como Administrador, quero que o processo fique na etapa da plataforma que corresponde à última coluna "Concluído" da planilha, com status Finalizado, para refletir onde ele realmente está.
20. Como Administrador, quero que "Não realizada" conte como "Concluído", para respeitar a época em que não se fazia a modelagem técnica.
21. Como Administrador, quero que Modelagem Piloto concluída leve à etapa Modelagem piloto; Modelagem Técnica ou V - Relatório Piloto, a Relatório e modelagem técnica; Revisão Interna, a Revisão interna; e VI - Revisão e validação, a Aprovação pelo setor.
22. Como Administrador, quero que as colunas I, II e III não decidam a etapa, para seguir a regra definida.
23. Como Administrador, quero que o processo sem "Concluído" nas quatro primeiras colunas de etapa (I, II, III e Modelagem Piloto) entre em Não iniciados com status A fazer.
24. Como Administrador, quero que "Concluído" na VII (Publicação) leve o processo a Concluídos, com a Data da Publicação da planilha, para que ele já conste como entregue.
25. Como Administrador, quero que o processo importado em Concluídos entre no Quadro como qualquer concluído (fica na coluna Concluídos até alguém tirá-lo ou até completar 30 dias, contados da importação), para ver todos os processos no Quadro logo depois da carga.
26. Como Administrador, quero que a VII concluída sem data ou com data ilegível entre em Concluídos com a data de hoje e apareça na lista de avisos ("usada a data de hoje"), para que ele conste como entregue e eu possa corrigir a data depois.
27. Como Administrador, quero que a data da modelagem piloto de um processo que ficou em Não iniciados seja ignorada e listada, para não gravar data em processo que nem fez o piloto.
28. Como Administrador, quero que a data ilegível (formato "16 10 2026" ou "01/09/2026" aceitos; outros não) seja tratada como data em branco e listada, em vez de travar a carga toda.
28a. Como Administrador, quero que o processo fora de Não iniciados sem data da modelagem piloto, ou com ela ilegível, receba a data de hoje e apareça na lista de avisos, porque, se passou do piloto, o piloto foi feito.
29. Como Administrador, quero que um "Concluído" depois de uma coluna vazia valha pela última coluna "Concluído" e apareça como aviso, para conferir a planilha.
30. Como Administrador, quero que o nome do processo com " - " seja tratado como nome comprido e não vire subprocesso, para seguir a regra "todos entram como processo".
31. Como Administrador, quero que as Observações (coluna R) virem Anotações do processo, para não perder o que a equipe escreveu.
32. Como Administrador, quero que o responsável do processo siga a regra da plataforma (responsável inicial da etapa, ou ninguém; Concluídos sem responsável), para não inventar donos.
33. Como Administrador, quero que cada processo importado tenha um único registro no histórico, "importado da planilha", com quem importou e quando, para saber a origem.
34. Como Administrador, quero que a contagem de "processo parado" comece na importação, para não nascer tudo marcado como parado por causa de datas antigas.

### Rodar de novo e repetições

35. Como Administrador, quero que o processo que já existe (mesmo setor e mesmo nome) seja pulado e listado como "já existia", para rodar a importação de novo sem medo.
36. Como Administrador, quero que a importação nunca altere um processo, setor ou macroprocesso que já está na plataforma, para não desfazer trabalho da equipe.
37. Como Administrador, quero que a linha repetida na mesma planilha (mesmo setor e nome) valha pela primeira e a segunda seja listada, para ver o erro de digitação.

### Resultado da primeira entrega

38. Como Administrador, quero, ao fim da gravação, um resumo com o que foi criado, o que foi pulado e os avisos, para conferir contra a planilha.
39. Como Administrador, quero que, se a gravação falhar no meio, a tela diga o que aconteceu e o que já foi gravado, sem deixar processo pela metade, para poder repetir com segurança.
40. Como Administrador, quero que, ao terminar, os processos importados apareçam nas telas de sempre (Lista, Quadro, Cadastros) nos setores e etapas certos.

### Segunda entrega: arquivos das versões

41. Como Administrador, quero escolher a pasta DOCUMENTOS MAPEAMENTO no meu computador, para os arquivos irem direto de lá ao Drive sem passar por outro lugar.
42. Como Administrador, quero que a pasta decida quais versões cada processo tem, pelo nome dos arquivos (`SIGLA_V<número><letra>_<Nome do processo>[_Relatório].<extensão>`), e que as colunas V1 a V8 da planilha só sirvam de comparação no relatório final, para carregar o que existe de fato.
43. Como Administrador, quero que a letra do nome diga o tipo da versão (F, histórica, em Versões históricas; P, piloto; sem letra, em sequência), com o número único por processo qualquer que seja a letra, e que um processo possa ter várias versões históricas.
43a. Como Administrador, quero que o arquivo da mesma versão com letra diferente da do .bpm (por exemplo `V1F.bpm` com `V1_Relatório.docx`) entre na versão do .bpm, com a letra dela, e apareça como aviso no relatório final, porque a letra diferente é erro de digitação.
44. Como Administrador, quero ver na prévia, por processo, as versões que vão entrar, os relatórios ligados a elas e o que está faltando ou sobrando.
45. Como Administrador, quero que a versão da pasta sem .bpm seja listada e não entre, e que as outras versões do processo entrem, para não perder tudo por causa de um arquivo.
46. Como Administrador, quero que .png ou relatório ausentes não gerem aviso, para não ver ruído de coisa opcional.
47. Como Administrador, quero que o arquivo de processo inexistente (sigla e nome que não batem com um processo da plataforma) ou com nome fora do padrão não entre e seja listado, para saber o que sobrou na pasta. (Desde 2026-11-10: o arquivo casa com o processo apesar de diferença de caixa, acento e espaço repetido no nome; a gravação segue a regra de identidade do banco.)
48. Como Administrador, quero que o .docx de relatório entre como o relatório da versão do nome (na versão histórica, sem número próprio, como na plataforma), e que o .pdf de relatório da mesma versão entre nos Outros anexos do processo.
48a. Como Administrador, quero que a versão com dois .docx de relatório fique sem relatório (os dois de fora e listados), entrando com os outros arquivos, para eu escolher depois qual vale.
48b. Como Administrador, quero que a pasta dentro da pasta do setor seja lida também, com os arquivos ligados ao processo pela sigla e pelo nome, e que o processo ganhe nas Anotações uma linha com o nome dessa subpasta, para saber de onde vieram.
48c. Como Administrador, quero ver no relatório final: os buracos na numeração (por exemplo V1 e V3 sem V2), as versões sem .bpm, os relatórios duplicados, os arquivos sem processo correspondente e a diferença entre a pasta e as colunas V1 a V8 da planilha (versão na pasta e não na planilha, e o contrário), para corrigir depois.
49. Como Administrador, quero que a versão marcada com a etapa do processo no momento da importação, para o histórico fazer sentido.
50. Como Administrador, quero que as travas de etapa do envio de versões (histórica só em Não iniciados, piloto só na Modelagem piloto, em sequência só nas suas etapas) fiquem de lado só na importação, para versões antigas entrarem em qualquer processo, e que o número único por processo e o .bpm obrigatório continuem valendo.
51. Como Administrador, quero que a versão que já existe (mesmo processo e número) seja pulada e listada, e que nenhum arquivo seja substituído, para rodar de novo sem medo.
52. Como Administrador, quero acompanhar o andamento do envio dos arquivos (quantos já foram, quantos faltam), para saber que a tela não travou numa carga grande.
53. Como Administrador, quero que, se o envio de um arquivo falhar, a tela liste a falha e siga com os outros, e que repetir depois só complete o que faltou, para não recomeçar do zero.
54. Como Administrador, quero ver, ao fim, o resumo (versões criadas, puladas, não entradas e avisos), para conferir contra a pasta.
55. Como membro da equipe, quero abrir uma versão importada e baixar os arquivos dela como qualquer outra versão, com o nome padrão, para não precisar saber que veio da importação.
56. Como Administrador, quero que o histórico do processo registre quem importou cada versão e quando, para ter rastro.

### Segurança e dados

57. Como Administrador, quero que a gravação passe pelas regras do banco, como qualquer cadastro, para que a importação não tenha poder maior que o meu.
58. Como pessoa responsável pelo escritório, quero que nenhum arquivo da pasta de documentos vá ao GitHub nem a qualquer lugar fora do Drive do CED, para respeitar a regra dos arquivos.
59. Como desenvolvedor, quero poder testar tudo com .csv e arquivos inventados no desenvolvimento, para não ver dado real na sessão.

## Implementation Decisions

- **Uma tela só, duas entregas.** Administração → Importação, só Administrador, com duas seções em sequência: "1. Cadastros e etapas" (planilha) e "2. Arquivos das versões" (pasta). Cada seção tem as fases escolher, prévia, confirmar, resumo. A segunda só habilita depois que existe ao menos um processo importado.
- **Leitura no navegador.** A planilha é lida no próprio navegador, em .csv exportado da aba PRODUTO 33 (recurso nativo, sem dependência nova; ler .xlsx exigiria biblioteca e ADR de dependência). A pasta é escolhida pelo seletor nativo de pasta; os arquivos saem do computador direto para a função `arquivos-no-drive`.
- **Lógica de leitura separada da gravação.** Um módulo transforma o conteúdo da planilha numa lista de processos com setor, macroprocesso, etapa, status, data de publicação, anotação e avisos, sem tocar em banco nem em tela. Outro faz o mesmo para a lista de arquivos da pasta cruzada com as colunas V1 a V8. A prévia mostra o resultado deles; a confirmação os grava.
- **Gravação pelo contrato de dados que a plataforma já usa**, com o mesmo padrão de "falso" das outras áreas (contrato de importação com implementação real e implementação falsa para testes), passando pelas regras por perfil do banco. A importação de cadastros usa um conjunto de operações que reaproveita setor e macroprocesso existentes, pula o processo já existente e grava o histórico único "importado da planilha" com quem importou.
- **Regra das travas só na importação.** O banco ganha um caminho de gravação de versão para a importação que ignora as travas de etapa do envio (ADR 0028 e ADR 0025), mantém o número único por processo e o .bpm obrigatório, e marca a versão com a etapa do processo no momento. Esse caminho só aceita o perfil Administrador.
- **Etapas e status.** Regra única de correspondência (última coluna "Concluído", "Não realizada" conta) e três saídas: Não iniciados com A fazer, as etapas do meio com Finalizado e Concluídos (no Quadro, com a Data da Publicação, saindo dele pela regra dos 30 dias como qualquer concluído). Casos fora da regra do Q9 viram avisos listados, nunca erro que derrube a carga. A data da modelagem piloto ou da publicação que falta, ou que está ilegível, num processo que deveria tê-la, recebe a data de hoje (o dia em que a planilha é lida), com aviso. A data da modelagem piloto no futuro continua ignorada, com aviso.
- **Identidade do item.** Processo existente = mesmo setor e mesmo nome (comparação sem diferença de caixa e espaços nas pontas); versão existente = mesmo processo e mesmo número. Linha repetida na planilha: vale a primeira.
- **Reaproveitamento de "A definir".** Um macroprocesso comum com esse nome por setor, criado pela importação; nenhuma regra especial no resto da plataforma.
- **Falha no meio.** A gravação dos cadastros é por processo, de forma que cada processo é inteiro ou não entra; o resumo conta o que entrou. A segunda entrega envia arquivo a arquivo e mostra o andamento; repetir completa o que faltou.
- **Desenho da pasta.** Registrado em `.scratch/importacao-dados-atuais/amostra/pasta.md` (nomes inventados, contagens reais), com as decisões do usuário de 2026-11-06. A seção 2 pede, além da pasta, o mesmo .csv da seção 1, só para a comparação com V1 a V8 no relatório final.
- **Sem alterar o que existe.** Nenhuma operação da importação faz alteração ou exclusão sobre dados já presentes. A única exceção é a linha da subpasta nas Anotações (história 48b), que só se acrescenta ao fim do texto e não se repete se a importação rodar de novo.
- **Como ficou a segunda entrega** (2026-11-10). A versão histórica importada fica sem etapa, como toda versão histórica da plataforma; a piloto e a em sequência levam a etapa atual do processo (história 49). Na importação, o processo em Concluídos também recebe versão e anexo. A unidade de repetição é a versão: se um arquivo dela falha, ela volta inteira na rodada seguinte; o `.pdf` do relatório que falhou volta sozinho quando a versão já entrou. O `.docx` da versão que não é histórica leva o próximo número de relatório do processo, na ordem crescente das versões. Dois `.bpm` na mesma versão deixam a versão de fora; dois `.png` ou dois `.pdf` seguem a regra dos dois `.docx`. Os avisos (letra corrigida, duplicados, subpasta) aparecem na prévia e no resumo; as lacunas, só no resumo.
- **Limites da leitura.** As Observações acima de 8000 caracteres entram cortadas, com aviso; a linha sem Área ou sem nome de processo é ignorada, com aviso; a linha repetida aparece com o nome como está na planilha.

## Testing Decisions

- **Ponto de teste: a tela inteira.** Testes pela interface, como a pessoa usa: renderizar o aplicativo como Administrador com as implementações falsas (`acesso`, `cadastros`, `processos`, `versoes` e a nova `importacao`), escolher o arquivo na tela, ler a prévia, confirmar e conferir o resumo e o que apareceu nas telas de Lista, Quadro e Cadastros. É o mesmo padrão dos testes `App.*.test.tsx` que já existem; o ponto novo é só a nova implementação falsa de importação. Os módulos de leitura da planilha e da pasta são cobertos por esses testes, não por testes próprios por função.
- **O que faz um bom teste aqui:** só comportamento visível (textos da prévia, contagens, avisos listados, processo na etapa certa, nada gravado antes de confirmar, rodar de novo pula o que existe, perfil sem acesso não vê a tela). Nada de checar chamadas internas ou estrutura de módulos.
- **Casos obrigatórios por história:** cada regra do Q3 a Q9 e Q11 a Q20 da sabatina vira um caso com planilha .csv e pasta de arquivos inventados (setores XYZ e ABC, processos "Exemplo Alfa" etc., como no formato da amostra).
- **Regras do banco (pgTAP).** A nova gravação de versão pela importação (trava de etapa ignorada, número único e .bpm mantidos, só Administrador) é regra de banco e segue a prática do projeto: teste pgTAP com cada perfil, usuário desativado e visitante, escrito antes da migração. Isso é a única exceção ao ponto de teste na tela, por ser regra que a tela não consegue provar.
- **Prova real.** A carga com dados reais é feita pelo usuário na produção, pela tela, depois do backup da produção; nada de dado real na sessão (Q21).
- **Arte anterior:** `App.gestaoDeUsuarios.test.tsx` (tela de Administração com falsos e perfil), `App.enviarVersao.test.tsx` e `App.registrarVersaoHistorica.test.tsx` (envio de versões com `VersoesFalso`), `App.cadastrarProcesso.test.tsx` (cadastro de processo).

## Out of Scope

- Importar .xlsx direto, ler a planilha pelo Google Drive ou por link.
- Colunas I, II e III (ficam fora do que decide etapa), D (oculta), VIII e IX (nenhum processo chegou lá). Na segunda entrega, a versão vem do nome do arquivo, sem limite de número; as colunas V1 a V8 só entram na comparação.
- Subprocessos (todos entram como processo) e reclassificação automática de "A definir".
- Alterar, atualizar ou apagar dado que já existe na plataforma; importação incremental inteligente.
- Importar e-mails .eml, anexos avulsos além do .pdf de relatório (história 48), anotações além das Observações, usuários ou responsáveis por nome.
- Um workflow do GitHub Actions ou script local com senha (ADR 0044).
- Importar o histórico detalhado de cada etapa (só o registro único "importado da planilha").
- Desfazer a importação em bloco (reversão fica por exclusão normal dos cadastros ou por restauração do backup).

## Further Notes

- **Duas entregas, dois tickets** (a quebrar no `to-tickets`): cadastros e etapas; arquivos das versões. A primeira não depende do desenho da pasta; a segunda começa pela amostra do formato.
- **Suposição a confirmar no ticket 1:** que o usuário consegue exportar a aba como .csv (separador e codificação a conferir com um arquivo inventado); se a exportação pelo Excel gerar acentos quebrados, tratar como ajuste de leitura.
- **Antes da carga real na produção:** backup do banco de produção (criar `BACKUP_SENHA_PRODUCAO`), conforme `.scratch/proximo-passo.md` e o roteiro de produção.
- **Termos:** "Importação dos dados atuais", "setor", "macroprocesso", "processo", "versão", "relatório", "etapa", "Concluídos", "A definir" seguem o `CONTEXT.md`. Termos técnicos usados só para explicar (prévia, falso) não entram na tela nem no domínio.

## Ajuste de 2026-11-06

Status: ready-for-agent

Pedido depois da primeira tentativa de carga no desenvolvimento (`/demanda`, mudança em funcionalidade existente) e planejado no modo curto. A planilha real tem processos com o piloto ou a publicação feitos e sem a data, e siglas como "DAE/CTL", que o banco recusa. Com a data de hoje no lugar da que falta, esses processos entram na etapa certa e ficam na lista de avisos, para a equipe corrigir a data depois. A sigla passa a entrar com hífen. O banco não muda.

Respostas do usuário: aviso na prévia sempre que a data de hoje for usada; data ilegível tratada como data em branco; a data de hoje vale para todo processo fora de Não iniciados, e não só para os que ficam na Modelagem piloto; a sigla que continuar inválida depois da troca segue como hoje (falha na gravação e aparece no resumo).

Critérios de pronto:

- [x] VII concluída sem Data da Publicação: o processo entra em Concluídos com a data de hoje e o aviso "VII - Publicação concluída sem Data da Publicação: usada a data de hoje."
- [x] VII concluída com Data da Publicação ilegível: o mesmo, com o aviso "Data da Publicação ilegível: usada a data de hoje."
- [x] Processo fora de Não iniciados sem data da modelagem piloto: entra com a data de hoje e o aviso "Modelagem Piloto sem data: usada a data de hoje."; com data ilegível, o mesmo, com o aviso "Data da Modelagem Piloto ilegível: usada a data de hoje."
- [x] Continuam iguais: a data da modelagem piloto no futuro é ignorada, com aviso; a data em processo Não iniciado é ignorada, com aviso; a Data da Publicação sem a VII concluída é ignorada, com aviso.
- [x] "DAE/CTL" e "DAE / CTL" entram como o setor "DAE-CTL", reaproveitam o "DAE-CTL" que já existe e contam como o mesmo setor para "já existia" e para linha repetida.
- [x] "Hoje" é a data do dia da leitura, a mesma que já serve para reconhecer a data no futuro.
- [x] Testes pela tela (`App.*.test.tsx`, .csv inventado) para cada critério acima; os testes que provavam a regra antiga (VII sem data em Publicação) são atualizados.

### Ajuste de 2026-11-06: Concluídos no Quadro

Pedido do usuário depois da carga no desenvolvimento: "quero todos no quadro". Revoga a Q20 da sabatina (ADR 0045). O processo importado em Concluídos deixa de entrar tirado do Quadro e segue a regra de todo concluído: fica na coluna Concluídos do Quadro por etapa até alguém tirá-lo ou até completar 30 dias em Concluídos, contados da importação. Muda só a função `importar_processo` do banco (migração `20261106230000_importado_concluido_no_quadro`); a tela não muda.

Critérios de pronto:

- [x] O processo importado em Concluídos aparece no Quadro, sem a marca de tirado do Quadro (teste `74_importar_processo`).

Implementado em 2026-11-06 (commit fbb2957)

### Ajuste de 2026-11-10: .bpm nas abas da versão mais nova

Pedido do usuário depois da carga da pasta no desenvolvimento, feito no caminho curto de ajuste. Em vários processos, as versões anteriores não têm .bpm próprio: o fluxograma delas está em outras abas do .bpm da versão mais recente. A importação apontava "sem .bpm" e deixava essas versões de fora, com o .png e o relatório delas. O banco exige um .bpm em toda versão, e a regra dele não muda.

Decisão do usuário (entre usar o .bpm da mais nova, permitir versão sem .bpm por migração e só trocar o aviso): a versão sem .bpm usa uma cópia do .bpm da **versão seguinte do mesmo processo que tem .bpm próprio** (a de número maior mais próximo). O .png, o relatório e o .pdf dela entram normalmente, e o .bpm vai ao Drive com o nome padrão da versão dela. Sem versão seguinte com .bpm no processo, a versão continua de fora, como na história 45. Muda só a leitura da pasta: sem migração.

Critérios de pronto:

- [x] Versão sem .bpm, com versão seguinte do mesmo processo com .bpm: entra com o .bpm dela e com os próprios .png, relatório e .pdf.
- [x] Aviso na prévia e no resumo: "{processo} V1: sem .bpm próprio; usa o .bpm da V2, que tem as versões anteriores em abas."
- [x] Versão sem .bpm e sem versão seguinte com .bpm: continua de fora, com "sem .bpm."; o .bpm de outro processo não serve.
- [x] Testes: `lerPasta.test.ts` e `App.importacaoDaPasta.test.tsx`.

Entregue em 2026-11-06 (commit ec2b9d0), com ressalva: [visual] da primeira entrega visto só na vitrine local com módulos falsos

Entregue em 2026-11-10 (commit 005cea9), com ressalva: [visual] da segunda entrega conferido só por medida no navegador, na vitrine local com dados falsos
Entregue em 2026-11-10 (commit 46aedf9)
Entregue em 2026-11-10 (commit 6fa818b)
