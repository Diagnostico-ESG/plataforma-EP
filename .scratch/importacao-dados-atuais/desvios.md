# Desvios de importacao-dados-atuais

## 2026-11-05 (ticket 01)

- **Macroprocesso é global.** A spec fala em "A definir" criado "com os setores que aparecerem nele" e em reaproveitar o macroprocesso "no setor". No banco o macroprocesso não pertence a um setor (o vínculo é `setores_envolvidos`, criado pelo gatilho do processo). A importação reaproveita o macroprocesso pelo nome (sem diferença de caixa) em toda a plataforma e o vínculo com o setor nasce sozinho. Efeito: "A definir" é um único macroprocesso, ligado a todos os setores que tiverem processo nele.
- **Data da modelagem piloto.** A spec só diz que a data em Não iniciados é ignorada. Valem também, com aviso: data ilegível ou no futuro (o banco recusa data futura da modelagem piloto). A data só é gravada quando o piloto foi feito.
- **Aba só com o módulo ligado.** A prop `importacao` do `App` e de `AreaDeAdministracao` é opcional (a aba some sem ela), para não mexer nos 53 arquivos de teste que já montam o `App`; o `main.tsx` sempre a passa.
- **Falha no meio da carga.** A tela para na primeira falha e diz quantos entraram e quantos ficaram sem tentar; o texto manda escolher o arquivo de novo (o que já entrou é pulado).
- **Testes de banco pelo GitHub Actions**, não pelo Docker local (fechado nesta sessão).

## 2026-11-06 (ajuste de 2026-11-06 e /ship da primeira entrega)

- **`/polir` pulado** por decisão do usuário: o ajuste só mudou o texto dos avisos da prévia.
- **Corrigido na revisão do `/ship`** (caminho de bug, teste vermelho antes): o aviso de linha repetida mostrava o nome do processo em minúsculas e agora mostra como está na planilha; a falha ao ler o que já existe na plataforma jogava fora o motivo e agora o mostra na frase; a chave da linha repetida passou a usar `chaveDoProcesso`, a mesma da prévia e do banco.
- **Escopo a mais, aceito:** as Observações acima de 8000 caracteres são cortadas, com aviso; a linha sem Área ou sem nome é ignorada, com aviso; o leitor, o .csv, o falso e o contrato real têm testes próprios, além dos testes pela tela (a spec previa só os da tela; o `CLAUDE.md` pede teste para toda função nova).
- **Regra antiga ainda aceita no banco:** `importar_processo` ainda aceita a etapa `publicacao` sem data, e o teste `74_importar_processo` prova esse caso. Isso não causa dano, porque o leitor não envia mais esse caso desde o ajuste. Fica como está, porque o banco não muda neste ajuste.
- **O que ficou para depois** está no `.scratch/backlog.md` (linha de 2026-11-06): o resumo sem a contagem de setores e macroprocessos, a mensagem do banco sem o valor e os testes que faltam.
- **Revisão de segurança: só a de reserva.** O usuário pediu para concluir sem rodar o `/security-review`. Na revisão de reserva das mudanças desde `marco/2026-11-05-inicio-importacao-dados-atuais`, não houve achado: a função do banco confere o Administrador ativo antes de gravar qualquer coisa, e o teste `74` cobre cada perfil, o usuário desativado e o visitante; a função com poder ampliado fica na área protegida do banco (schema `private`, com `search_path` vazio); a tela mostra o conteúdo da planilha só como texto, sem montar HTML com ele. Observação: o .csv não tem limite de tamanho, mas um arquivo enorme trava só o navegador de quem o escolheu.

## 2026-11-06 — Concluídos importados no Quadro (fora do funil, por decisão do usuário)

- **Mudança de regra:** o usuário pediu todos os processos no Quadro depois da carga; a Q20 da sabatina (importados em Concluídos já tirados do Quadro) foi revogada pelo ADR 0045. Migração nova `20261106230000_importado_concluido_no_quadro` (a `importar_processo` já está na produção, então não foi editada).
- **Sem funil:** o usuário mandou fazer direto, sem `/demanda`, `/executar-simples` nem `/ship` ("Só faça direto"). Valeu a instrução explícita do momento sobre a regra do `CLAUDE.md` de que toda mudança passa pelo funil. Teste de banco alterado antes da migração; sem revisão de código nem marca de entrega nova.
- **Causa da carga incompleta no desenvolvimento:** o catálogo de etapas estava vazio (limpeza antiga), e a importação recusava com `etapa_invalida:concluidos`. O usuário restaurou com `.scratch/restaurar-catalogo-de-etapas.sql`.

## 2026-11-09 — Ticket 02, arquivos das versões da pasta (`/executar-complexo`)

- **Versão histórica sem etapa:** a história 49 pede a versão marcada com a etapa do processo no momento. A histórica importada fica sem etapa (`etapa_id` nulo), como toda versão histórica da plataforma; a piloto e a em sequência levam a etapa atual. Interpretação do executor, a confirmar.
- **Processo concluído recebe arquivo na importação:** a função `arquivos-no-drive` e o banco recusavam versão e anexo fora de "em andamento". Com a marca da importação, o processo em Concluídos também recebe (sem isso, as versões dos processos já publicados não entrariam). Fora da importação, nada muda (teste 75).
- **Unidade de repetição é a versão:** se um arquivo da versão falha, a versão não é registrada e a próxima rodada a envia inteira. Os arquivos dela que já tinham subido ficam soltos na pasta do processo no Drive, como em qualquer envio que falha hoje.
- **Relatório numerado na ordem da pasta:** o `.docx` da versão que não é histórica leva o próximo número de relatório do processo (ADR 0026), contado na ordem crescente das versões; o número só avança quando a versão entra, e o banco confere.
- **Duplicados:** dois `.bpm` na mesma versão (a pasta real não tem) deixam a versão de fora, listada; dois `.png` ou dois `.pdf` seguem a regra dos dois `.docx` (história 48a): a versão entra sem eles, com aviso.
- **Ciclo de banco pelo GitHub:** o motor do Docker não subiu nesta máquina; o teste 75 falhou e depois passou no "Testes de banco" (execuções 42726426883 e 42726990545, com a migração ensaiada), e a migração foi aplicada pelo "Migrar banco de desenvolvimento" (execução 42727400572). O teste 22 já falhava na `main` desde 2026-11-09 e foi para o backlog.
- **`[visual]`:** conferido na vitrine local (`vitrine.local/importacao.html`) pelo texto da página e por medida em 375 px (sem rolagem horizontal); a captura de tela não funcionou com a janela minimizada.

## 2026-11-09 — /polir (Impeccable audit e polish) da Importação

Visto na vitrine local `vitrine.local/importacao.html` (o projeto não tem `npm run vitrine`), por medida no navegador, no computador e em 375 px. Audit: 17/20; o detector não achou nada.

Corrigidos (só estilo):
- Campos de arquivo nativos das duas etapas em Arial 13px e 21px de altura: passaram à fonte da plataforma, com o botão de escolher no aspecto do botão comum e 34px de altura (princípio 10 do `interface.md`).
- Campos da seção 2 empilhados por `<br />`: rótulo em cima e espaçamento do sistema (padrão `.campo-de-arquivo`, o mesmo das versões).
- Rótulos das versões na tabela da prévia em fonte mono, como o DESIGN.md pede para versão.
- Botões secundários das duas etapas ("Escolher outro arquivo", "Importar outro arquivo", "Escolher outra pasta", "Importar de novo") sem borda: passaram a `botao-secundario`, como no resto da Administração.

Deixado de fora: o resumo das duas etapas fica inteiro dentro de `role="status"`, e o leitor de tela o lê todo de uma vez. É o padrão das duas seções; mudar só uma criaria diferença, e mudar as duas mexe em como a tela avisa o fim da carga. Nenhum achado mudou comportamento, então nada foi para o backlog.

## 2026-11-10 — /ship da importação (ajuste "Concluídos no Quadro" e ticket 02)

Revisado do marco `marco/2026-11-06-entrega-importacao-dados-atuais` até o commit 57e3dbb (código em `src/` e `supabase/`; os commits da atualização do DevFlow e da capa-de-entrada ficaram fora).

- **Revisão de código, eixo da spec, dois achados reais, corrigidos no commit 57e3dbb com teste que falhou antes:**
  - **História 53:** se a versão entrava e só o `.pdf` do relatório falhava, a rodada seguinte pulava a versão e o `.pdf` nunca voltava. A prévia passou a ler os anexos do processo e envia o `.pdf` que faltou (teste "o .pdf do relatório que falhou volta na rodada seguinte").
  - **História 44:** a prévia não mostrava a letra corrigida, os duplicados nem a subpasta. Os avisos passaram a aparecer na prévia e no resumo, com o mesmo texto.
- **Revisão de código, eixo dos padrões, corrigidos no mesmo commit:**
  - A lógica de envio ao Drive estava em três cópias; `versoesSupabase` e `anexosSupabase` passaram a usar `enviarAoDrive`.
  - `motivo(erro)` repetia `mensagemDoErro`.
  - A sigla saía da chave por `split`; virou campo próprio.
- **Revisão de código, ficou de fora:** foi para o backlog, com o motivo em cada linha.
- **Revisão da spec contra interpretações:** concordou com quatro das interpretações de 2026-11-09. A versão histórica sem etapa (história 49) continua como interpretação a confirmar pelo usuário; a spec foi atualizada para dizer como ficou.
- **Testes por função:** a revisão apontou que `lerPasta`, `lacunasDaPasta` e `importacaoDaPastaSupabase` têm testes próprios, além da tela. Segui o `CLAUDE.md` ("toda função nova ganha teste"), mais cauteloso que a spec ("não por testes próprios por função").
- **Revisão de segurança** (subagente pela `revisao-seguranca.md`): nenhum achado com confiança 8 ou mais. Descartados:
  - O Administrador pode chamar `importar_versao` direto pela API com um `drive_id` inventado: só ele pode, e os `registrar_*` antigos têm o mesmo desenho (confiança 3).
  - O nome vazio do anexo é barrado pela regra da tabela, e não pela função (confiança 2).
  - O nome da subpasta aparece na mensagem de erro, só na tela do Administrador (confiança 2).
- **Auditoria de pacotes:** produção sem vulnerabilidade. Só desenvolvimento: 2 altas (`undici` pelo `jsdom`, `zod` pelo `eslint-plugin-react-hooks`) e 9 moderadas (cadeia do `eslint`), as mesmas da linha de base de 2026-11-05; ficam no backlog.
- **Banco:**
  - Migrações não destrutivas; tipos em dia; `security definer` só em `private`.
  - O teste 22 (`catalogo_de_etapas`, itens 8 e 9) reprova desde 2026-11-09. Pelos valores do CI, há no banco de desenvolvimento uma etapa entre "Revisão interna" e "Validação com o setor", e o teste espera as duas vizinhas. É dado do banco, fora desta funcionalidade, e não regressão dela; os testes 74 e 75 passam.
  - A marca foi gravada com isso registrado; segue no backlog.
- **`[visual]`:** conferido só por medida no navegador, na vitrine local com dados falsos (a captura de tela não funcionou com a janela minimizada); a marca sai com ressalva.

## 2026-11-10 — casamento da pasta mais solto (bug, /demanda)

Arquivos cujo nome do processo diferia da planilha caíam em "sem processo na plataforma". A caixa já era ignorada; a causa provável era acento ou espaço repetido (o usuário não pôde mandar exemplo). Agora a pasta casa o processo ignorando caixa, acento e espaço repetido (, em ); a importação da planilha segue a regra do banco (). Isso contraria o item 8 de  (acento virava processo inexistente), por instrução do usuário no momento. Risco aceito: dois processos do mesmo setor que só diferem em acento ou espaço colidiriam; está no backlog.
