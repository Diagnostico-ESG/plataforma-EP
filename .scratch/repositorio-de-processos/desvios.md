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

## 2026-10-29 — /polir, ticket 05 (árvore da Lista por macroprocesso)

Escopo: `ArvoreDaLista.css`, `LinhaDoProcesso`, `LinhasDeGrupo`, `LinhaDosArquivos`, `ControlesDoQuadro`. Auditoria do Impeccable: detector sem apontamentos; conferência no Chrome na vitrine local (módulos falsos, 1366×768, só pelo texto e estilos calculados: o painel do navegador estava oculto e a captura de tela não funcionou). Nota: 17/20 (Bom). Acessibilidade 3, desempenho 3, responsivo 3 (uso em desktop), tema 4, integridade 4.

**Corrigido no polimento**
- [P2] A seta que abre os arquivos tinha cerca de 18×20 px; agora tem no mínimo 24×24 px (WCAG 2.2, 2.5.8).
- [P2] A borda entre a linha do processo aberto e a linha dos arquivos foi tirada (`tr:has(+ .linha-dos-arquivos)`), para os arquivos se lerem como parte do processo.
- [P2] A linha de título do macroprocesso e do setor agora é clicável por inteiro (o botão ocupa a largura); antes só o texto respondia.
- [P3] O nome do macroprocesso e do setor fica azul ao passar o mouse.

**Deixado de fora**
- [P3] A árvore é remontada a cada mudança de estado, sem memoização: no porte do projeto (dezenas de processos) não pesa; revisitar se a Lista passar de milhares de linhas.
- Responsivo: a tela é de desktop (PRODUCT.md); a tabela não ganhou variante para celular.
- Os critérios `[visual]` seguem presumidos (sem captura de tela); a tela com o login real não foi vista.

## 2026-10-29 — /ship (repositorio-de-processos, tickets 01 a 05)

Ponto de partida da revisão: `marco/2026-10-28-inicio-repositorio-de-processos`. Coberta junto, por serem as specs que esta funcionalidade altera (cada uma estava com `Em revisão desde 2026-10-28`): `processos-etapas`, `publicacao-e-arquivamento`, `documentos-versoes` e `revisoes-aprovacao`.

**Achados e correções**
- **Dependência circular** (`npm run check:circular`): `ordenacaoDaLista.ts` e `linhasDaLista.ts` se importavam (o tipo `LinhaDaLista` e a função de ordenar). Corrigido: o tipo foi para `src/processos/tipos.ts` e `linhasDaLista.ts` o reexporta; `check:circular` limpo.
- **Teste de banco 53 frágil** (`53_etiqueta_e_responsavel`): num banco local recém-resetado ele aborta ("Dubious, test returned 3", sem nenhum `not ok`, e perde 28 asserções) porque desativar o administrador `a1` é recusado como "último administrador"; só passava se o banco já tivesse outro administrador ativo. A linha não foi tocada por esta funcionalidade, mas o teste foi alterado por ela. Corrigido: o teste cria um segundo administrador (`a5`). Bateria inteira no Docker local: 1671 `ok`, 0 `not ok`, nenhum erro além do formato conhecido. **Lição:** `0 not ok` não basta; conferir também que nenhum arquivo aborta (contar `ERROR` que não seja "RESULTADO DOS TESTES").
- **Spec × código:** a spec foi atualizada em duas frases: os subprocessos vêm logo depois do pai em qualquer ordenação (a Lista antiga não fazia isso), e o limite conhecido dos cancelados na árvore.
- **Revisão de código** (`/mattpocock-skills:code-review`, dois subagentes): a de spec não achou requisito faltando nem errado. A de padrões listou sobretudo cheiros de julgamento (propriedades que viajam juntas por `VisaoDosProcessos` e `AreaDeProcessos`, `LinhaDoMacro` e `LinhaDoSetor` parecidas, nomes das colunas repetidos em quatro lugares); as "violações duras" de tamanho de função não procedem (o ESLint do pre-commit passa) e a alegação de falta de teste de `arquivosDaArvore` e `ordenacaoDaLista` estava errada (os testes existem).
- **Revisão de segurança do código:** o `/security-review` não encontrou mudanças (a `main` já contém tudo). Foi feita a **revisão de reserva, menos completa**, por subagente sobre o diff desde o marco: nenhuma vulnerabilidade de confiança alta. Conferido: o gatilho que impede gravar `tirado_do_quadro_em` direto, `tirar_do_quadro` e `voltar_ao_quadro` sem `security definer` e com `search_path` vazio, sem `execute` para `anon`, a view com `security_invoker = true`, e a Edge Function só perdeu a leitura de `arquivado_em` (a conferência de quem chamou não mudou). Os componentes novos foram varridos por padrões perigosos, não lidos linha a linha.
- **Migração destrutiva** `20261029001211_fim_do_arquivado` (`drop column arquivado_em`): prevista na spec; confirmada pelo usuário em 2026-10-29.
- **Dependência circular, dependências de produção:** `package.json` não mudou; o `security-auditor` foi pulado e `.scratch/security.md` segue como está.

**Deixado de fora (menores, adiados)**
- Filtro que deixa só cancelados: a tela mostra "Nenhum processo…" e esconde "Mostrar cancelados (N)" (limite agora descrito na spec).
- "Abrir todos" relê as versões de todos os processos, mesmo os já prontos; a spec pede busca "só ao abrir". Escolha deliberada (a linha não fica velha depois de enviar versão).
- Trocar Todos | Concluídos zera o filtro da Situação (voltar a Todos não o restaura).
- Cheiros de código do revisor de padrões acima.

**Presumido (ressalva da marca)**
- Os critérios `[visual]` da spec (1 a 7) e dos tickets: nenhum visto com o login real; a árvore e o cabeçalho foram vistos só na vitrine local com módulos falsos, pelo texto e estilos calculados, sem captura de imagem.
- A migração `fim_do_arquivado` e `tirar_e_voltar_ao_quadro` não foram aplicadas ao remoto de desenvolvimento (GitHub Actions parado por cobrança), e a função `arquivos-no-drive` não foi publicada de novo; a bateria de banco foi verificada só no Docker local. `npm run db:types` não foi rodado no remoto; os tipos comitados já refletem as migrações.
- Revisão de segurança de reserva (menos completa) no lugar do `/security-review`.
