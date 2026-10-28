# Desvios de visual-do-cartao

Só recebe entradas novas, datadas.

## 2026-10-27 — Ticket 02 (cor do setor nos cadastros)

- **`OpcaoDaCaixa` ganhou a prop `corDoSetor` (número da cor), não usa a `cor` do ticket.** O ticket diz "`OpcaoDaCaixa` com `cor`". A `cor` existente recebe um texto CSS e aplica `background` inline; um degradê nesse atalho pode ser descartado pelo jsdom e o teste não o enxergaria. O quadradinho do setor usa duas variáveis CSS (`--cor-claro`, `--cor-escuro`), as mesmas do selo, e o degradê fica no CSS (`.opcao-cor-do-setor`). Efeito na tela: o mesmo quadradinho do macroprocesso, em degradê.
- **O selo no setor aberto editável fica acima do formulário**, porque o título do formulário é texto (`Setor TSA`). Na leitura (Consulta) o selo está na linha "Sigla".
- **Teste 58 ajustado:** ele insere um setor com os gatilhos desligados e passou a informar `cor`, porque a coluna é obrigatória.
- **Tipos gerados exigem `cor` no insert** (coluna obrigatória; o gatilho preenche no banco). `criarSetor` faz a conversão de tipo com comentário.
- **`[visual]` não conferido na tela:** o app exige login e não há vitrine no repositório. O contraste do texto escuro nas duas pontas das 30 cores está provado por teste (4,5:1). Conferir com o login real: selo legível nas 30 cores; quadradinho do [Pôr setor] igual ao do macroprocesso.

## 2026-10-27 — ticket 03 (trocar a cor do setor)

- **A cor só vai no [Salvar] quando mudou.** A spec diz "grava junto com o [Salvar]"; mandar a cor de volta sempre reverteria, sem aviso, uma troca feita por outra pessoa nesse meio-tempo (achado da revisão). Salvar só o nome não envia `cor`.
- **O formulário do setor não espera a lista de setores; a grade espera.** As marcas "em uso por" vêm de uma leitura extra de `listarSetores` ao abrir o setor (a contagem de macroprocessos vem junto e não é usada). Se a leitura falhar, a grade aparece sem as marcas. Aceito: informativo, e a leitura é barata; método próprio só se pesar.
- **"Primeira sigla em ordem" é comparação simples dos textos** (não depende do idioma do navegador). Setor inativo conta como "em uso", como no banco.
- **Dispensado da revisão:** ponto de "em uso" na cor do texto (o texto escuro já tem contraste de 4,5:1 nas duas pontas de todas as cores); faixa de 1 a 30 só no banco (o formulário nunca envia número fora dela).
- **`[visual]` não conferido na tela** (precisa do login real): grade de 30 amostras em 10 colunas sem rolar para os lados, linha acesa na escolhida, ponto discreto nas em uso, inclusive em 1366×768.

## 2026-10-27 — Ticket 04 (cor do setor na área Processos)

- **O Reclassificar não ganhou o quadradinho porque não tem campo Setor.** A spec (decisão 4) e o ticket dizem que a janela de Reclassificar usa o mesmo campo Setor do formulário, mas `JanelaDeReclassificacao` só troca o tipo e o processo pai (as opções de pai são "SIGLA — Nome", texto, fora do escopo). O quadradinho entrou no filtro Setor e no campo Setor do Novo processo e do Editar, que são o mesmo componente (`CamposDoProcesso`). Divergência spec × código a rever na leitura da spec; nada foi mudado na janela.
- **Docker local desligado:** o teste 67 e a migração rodaram só pelos workflows. O 67 falhou antes (`column "setor_cor" does not exist`, 0 ok) e passou depois, 7 de 7, com os demais arquivos verdes.
- **O helper `cartaoDe` dos testes aceita o nome na faixa** (`.cartao-nome, .cartao-faixa-nome`): por setor o nome do processo mudou de lugar. Os testes antigos que liam `.cartao-sigla` passaram a ler `.cartao-faixa` (a classe `.cartao-sigla` e `.cartao-topo` saíram do CSS).
- **A cor da falsa de processos** vem de `ProcessosFalso.corDoSetor` (padrão: a cor 1); `montarNosCadastros` a liga aos cadastros, para a troca de cor aparecer no Quadro depois de recarregar.
- **`[visual]` visto só em parte, na vitrine local (módulos falsos, 1366×768):** a faixa ocupa o topo do cartão de lado a lado (medido: 300 de 302 px, a diferença é a borda de 1 px), com cantos arredondados e a sigla centralizada, no agrupamento por etapa, na cor 1. **Não visto:** o nome do processo na faixa (a vitrine não tem setores, então o agrupamento por setor fica vazio), a faixa com a borda vermelha do parado, as 30 cores e um nome longo, e o selo do verso, o da Lista, o título da coluna e o quadradinho com o login real. Seguem presumidos.

## 2026-10-27 — /polir de visual-do-cartao (tickets 01 a 04)

- **Auditoria (código, `impeccable detect` nos arquivos dos tickets 01 a 04 e leitura de tokens e CSS):** 0 problemas de design; 2 avisos do detector. Acessibilidade: a cor não entra em nenhum nome acessível (selo e faixa só levam o texto da sigla ou do nome); o contraste do texto escuro nas duas pontas das 30 cores está provado por teste (4,5:1); `forced-color-adjust: none` no selo e no quadradinho preserva a cor no contraste forçado; a sigla (ou o título da coluna) está sempre escrita. Tema: o projeto não tem modo escuro, então o texto escuro sobre o tom claro não corre risco. Responsivo e desempenho: sem largura fixa, sem animação nova, sem toque especial; uso em desktop.
- **Corrigido:** os dois tamanhos de fonte soltos (`1rem` no nome da faixa e `1.125rem` na sigla da faixa) passaram a usar os tokens `--tam-coluna` (16px) e `--tam-painel` (18px); comentário sobre o raio da faixa.
- **Deixado de fora:** o raio de `calc(var(--canto) - 1px)` na faixa, que o detector acusa como fora da escala do DESIGN.md: é o raio do cartão menos a borda de 1px, para a faixa encostar no canto de dentro, e vale só para a faixa; um token novo para isso seria enfeite. O `[visual]` dos tickets 01 a 04 segue presumido (precisa do login real).

## 2026-10-27 — /ship de visual-do-cartao (tickets 01 a 04)

- **Ponto de partida da revisão:** marco `marco/2026-10-27-inicio-visual-do-cartao` (34 commits). `/mattpocock-skills:code-review` rodado nos dois eixos.
- **Padrões:** nenhuma violação dura. Cheiros de julgamento, aceitos: `setorCor ?? 1` repetido nas telas (o tipo é opcional de propósito, para os testes que montam processos à mão); o cast `estiloDaCor(...) as CSSProperties` repetido em quatro lugares; a faixa por setor repete o markup do selo para mostrar o nome no lugar da sigla; o número 30 solto na falsa de cadastros (`CadastrosFalso`) em vez de `TOTAL_DE_CORES`. Nada bloqueia; limpar numa passagem futura se pesar.
- **Spec:** (1) as cinco caixas não visuais do ticket 01 estavam desmarcadas, embora o código e os testes estivessem prontos: marcadas. (2) A spec de `processos-etapas` falava do quadradinho no Reclassificar, que não tem campo Setor: spec corrigida (decisão 4, história 21 e a frase da Solução). (3) O filtro Setor tira a cor dos processos carregados (como já tirava a sigla), e não de uma leitura à parte dos setores: aceito, é a mesma fonte da sigla. (4) As opções da etiqueta no Agora usam o mesmo componente das etiquetas vivas dentro da caixa personalizável; não conferido na tela.
- **Segurança:** `package.json` não mudou e `.scratch/security.md` já existe: `security-auditor` pulado. O `/security-review` só viu documentação (tudo já estava na `main`), então valeu a revisão de reserva das duas migrações: `cor` com privilégios por coluna sob a RLS que já existia (só Administrador e Integrante ativos criam e alteram; teste 66 por perfil, inativo e visitante); gatilho em `private`, sem `security definer`, `search_path` vazio e execução revogada; view recriada com `security_invoker = true` (teste 67); nenhuma chave secreta. Sem achados.
- **Banco:** migrações não destrutivas; tipos em dia; 55 arquivos de banco verdes no "Testes de banco" da `main`; o `test:db` local não roda na rede do escritório e o Docker estava desligado. `[auth] enable_signup = true` no `config.toml` é de propósito (ADR 0001, login pelo Google; o banco barra por domínio e autorização); o painel de desenvolvimento não foi reconferido.

## 2026-10-28 — /polir de visual-do-cartao (coluna tingida e etiquetas fortes, ADR 0031)

- **Auditoria (código; `impeccable detect` em `Quadro.css`, `ColunaDoQuadro.tsx`, `CartaoDoProcesso.tsx` e `tokens.css`, mais cálculo de contraste):** 0 problemas de design e 1 aviso, que já existia antes (o raio de 1px da barra da etapa, linha 230 do `Quadro.css`). Contraste calculado nas 30 cores do setor: o texto `texto` sobre o fim do degradê do cabeçalho tem no mínimo 5,31:1 (AA); a frase da coluna vazia (`texto-2`) sobre o fundo tingido tem no mínimo 4,66:1. Etiquetas com texto branco sobre o cartão branco: 6,0 / 7,9 / 5,5:1. Coluna inativa: texto sobre o cabeçalho cinza 11,15:1.
- **Corrigido na entrega, antes do polimento (revisão do `/implement`):** sigla de 18px passou a usar o token `--tam-painel`; folga lateral no cabeçalho para o nome do setor não passar por baixo da contagem; `forced-color-adjust` só na coluna colorida.
- **Polimento:** nada a mudar no código; nenhuma correção nova.
- **Deixado de fora:** o aviso do raio de 1px (é da barra da etapa, anterior a esta mudança). Os critérios `[visual]` 6 a 8 da spec (coluna até a base, sigla nas 30 cores, inativo distinto) não foram vistos na tela, que exige login: seguem presumidos, para você conferir com o login real.

## 2026-10-28 — /ship de visual-do-cartao (coluna tingida e etiquetas fortes, ADR 0031)

- **Ponto de partida da revisão:** marco `marco/2026-10-28-inicio-visual-do-cartao`. `/mattpocock-skills:code-review` rodado de novo sobre o diff final (o CSS mudou depois da revisão do `/implement`), nos dois eixos.
- **Padrões:** nenhuma violação dura. Cheiros de julgamento, aceitos: a decisão "coluna de setor, ativa ou inativa" repetida em três pontos de `ColunaDoQuadro.tsx` (pequena demais para um tipo próprio); os seis tokens `--etiqueta-*-texto` e `-bolinha` agora iguais (`#ffffff`), mantidos por serem um token por papel e já cobertos por teste; `--barra-coluna-trilho` reaproveitado como cabeçalho da coluna inativa (cinza já existente, sem token novo); nome do arquivo `etiquetasVivas.test.ts` e chave `concluido` mantidos (o rótulo muda só na tela); 30% da mistura e `Quadro.css` acima de 300 linhas (já passava antes; CSS fora do limite do ESLint).
- **Spec:** a revisão achou uma lacuna: sem teste de contraste da frase da coluna vazia sobre o fundo tingido. Corrigido: teste novo em `corDoSetor.test.ts`, nas 30 cores (≥ 4,5:1). O texto escuro sobre as duas pontas do degradê já tinha teste. Nada fora de escopo.
- **Dúvidas que só a tela resolve (seguem presumidas):** pílula "Inativo" neutra sobre o cabeçalho cinza; cabeçalho "colado no alto"; coluna até a base do Quadro; sigla legível nas 30 cores.
- **Segurança:** `package.json` não mudou e `.scratch/security.md` já existe: `security-auditor` pulado. Revisão de segurança do código pulada: mudança só visual, sem login, permissão, dado de fora nem migração.
- **Banco:** nada em `supabase/`; passo 7 pulado. Dependência circular: nenhuma. Cobertura 98,1% (instruções), 94,2% (ramos), 98,6% (funções), 99,1% (linhas); 3.137 testes passam.
- **Observação:** um teste de `App.editarRegistros` e um de `App.anexos` estouram o tempo quando a máquina está ocupada com outra tarefa, e passam sozinhos; não é da mudança.
