# Próximo passo (2026-10-31)

**Situação:** ticket 01 do `redesenho-do-quadro` concluído e juntado à `main` (commit b6558d7): faixa de controles de 56px com "Quadro ▾" e [Filtros n], barra de cima com busca e sino "Em breve", faixa lateral com Processos, Setores, Painel, Administração e Ajuda, telas "Em breve" do Painel e da Ajuda. Plano em `.scratch/redesenho-do-quadro/plano-01.md`. Faltam os tickets 02 a 05.

**Próximo comando:** sessão nova com Sonnet, `/situação`, depois `/executar-simples` no ticket 02 (Destacar os meus e Situação) ou `/executar-complexo` no ticket 03 (Linhas, ícone por etapa e "Você"); os dois só dependem do 01. O 04 (verso enxuto) pode ir a qualquer momento; o 05 vem depois do 04. Modo sugerido: 03 e 04 complexo; 02 e 05 simples. Depois do último, `/polir` (mexeu na interface) e então `/ship`.

**Decisão a confirmar:** no carregamento, [Cadastrar processo] fica habilitado (os outros controles da faixa ficam desabilitados). A spec pede "os controles da faixa desabilitados até os dados chegarem"; o botão ficou de fora porque abrir o cadastro não depende da lista. Se preferir todos desabilitados, é mover o botão para dentro do `fieldset` em `FaixaDeControles.tsx`.

**Depende do usuário:** confirmar a decisão acima; ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" da spec; ver a faixa com o login real (o `[visual]` do ticket 01 foi visto só na vitrine local); publicar a função `arquivos-no-drive` no desenvolvimento (ticket 05); conferir o Catálogo de etapas; escolher o responsável inicial de cada etapa.
