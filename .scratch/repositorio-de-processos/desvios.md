## 2026-10-29 — /executar-complexo, ticket 04 (Lista com filtro e ordenação por coluna)

**Spec e código divergentes**
- A spec ("Lista: cabeçalhos com filtro e ordenação") diz que os subprocessos seguem o processo pai "como hoje". Hoje não seguiam: a Lista ordenava por sigla do setor e nome, e o subprocesso aparecia onde o nome caísse, com o "↳ pai". Valeu o critério 5 do ticket: o subprocesso vem logo depois do pai, em qualquer ordenação.

**Decisões de execução (a spec não fixava)**
- Sem responsável e sem etapa atual ficam no fim, nos dois sentidos, como numa planilha. O empate desempata pelo nome do processo.
- Subprocesso cujo pai foi filtrado para fora entra na ordem normal, com o "↳ pai".
- Endereço: `ordenar=<coluna>` e `sentido=decrescente`; a ordem padrão (Processo, crescente) não vai ao endereço.
- A seção "Processos do setor" (cadastro do setor) usa a mesma montagem das linhas: lá também o subprocesso passou a vir logo depois do pai.
- Os menus do cabeçalho reaproveitam o menu "⋯" (`MenuDeAcoes`), que ganhou opções marcáveis e uma altura máxima com rolagem.

**Deixado de fora**
- Sem nenhum processo depois dos filtros, a tabela some com os cabeçalhos (a spec pede a mensagem com "Limpar filtros"). Para desfazer, só o "Limpar filtros", que tira todos os filtros de uma vez; antes, a barra deixava trocar um filtro só.
- Critério 8 (`[visual]`, menu dentro da tela em 1366×768): visto numa vitrine provisória com os módulos falsos (o menu de Responsável cabe e rola por dentro; o ponto do filtro e o ▼ aparecem). A tela com o login real não foi vista.

## 2026-10-29 — /executar-complexo, ticket 05 (Árvore por Macroprocesso com os arquivos)

**Decisões de execução (a spec não fixava)**
- Endereço: campo novo `agruparLista` ('nenhum' ou 'macroprocesso'); na Lista a chave `agrupar=macroprocesso`, no Quadro a chave `agrupar` segue com etapa, responsável e setor. Nenhum não vai ao endereço.
- Cancelados na árvore: o mesmo bloco "Mostrar cancelados (N)" da tabela, no fim e fora dos ramos; as colunas Setor e Macroprocesso já dizem o setor e o macroprocesso de cada um. A peça (`CanceladosDaLista`) é a mesma da tabela.
- Macroprocesso do subprocesso sem o pai nas linhas: o do pai, lido de todos os processos; sem o pai em lugar nenhum, o dele.
- Contagem: a do macroprocesso e a do setor contam processos e subprocessos que estão sob ele; o subprocesso de outro setor conta no setor do pai.
- Um só botão "Abrir todos" / "Fechar todos": "Fechar todos" fecha também macroprocessos e setores, deixando só as linhas de macroprocesso.
- Os arquivos são lidos de novo toda vez que o processo abre (por `listarVersoes`, o que o verso já lê); enquanto refaz, a linha mostra o que já tinha, para não ficar velha depois de enviar uma versão no verso.
- Na linha dos arquivos só entram .png, .bpm, .bpmn e o relatório que vale (o da versão ou o último numerado das anteriores, "Relatório V2 (da V7)"); anexos e o .pdf da aprovação ficam de fora.

**Deixado de fora**
- Critério 6 `[visual]` (macro e setor distintos, subprocesso recuado, linha dos arquivos como parte do processo) **presumido**: o painel do navegador estava oculto e a captura de tela não funcionou. Na vitrine local (módulos falsos, 1366×768) conferi pelo texto da página e pelos estilos calculados: a árvore monta, "Abrir todos" lê os arquivos de todos, a linha mostra V7, "Aprovada" e os três links, e não há rolagem lateral. A tela com o login real não foi vista.
- Revisão final: sem ferramenta de subagente autorizada, foi uma autorrevisão do autor (mais fraca que uma revisão independente).
