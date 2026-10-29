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
