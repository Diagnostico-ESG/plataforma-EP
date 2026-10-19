# 19: Histórico, Novo processo e Editar dentro da janela

**Como resolve a sua parte.** Hoje o histórico é uma aba do painel e o cadastro e a edição abrem num painel à parte, o que tira a pessoa do processo. Este ticket faz os três abrirem dentro da própria janela do verso e voltarem a ele, e mostra o histórico como uma linha do tempo agrupada por dia, fácil de ler. Depois de cadastrar, a janela já mostra o processo novo, porque o passo seguinte é quase sempre iniciar a Modelagem piloto ou marcar a reunião.

**What to build:** Histórico (pelo "⋯" do processo) substituindo o conteúdo da janela, que mantém a largura, com "← Voltar ao processo" e o título "Histórico"; linha do tempo do mais novo para o mais antigo, agrupada por dia ("Hoje", "Ontem", "12/10"), cada evento com a hora em mono, as iniciais de quem fez, a frase da ação com o antes e depois e, em cinza abaixo, o motivo ou a nota; o primeiro Esc volta ao verso e o segundo fecha. Novo processo (`#/processos/novo`) e Editar ocupando a janela, que encolhe para uma coluna de cerca de 560 px, com o cabeçalho "Novo processo" ou "Editar {nome}" e rodapé fixo com [Cadastrar] ou [Salvar] (principal) e [Cancelar]. Editar: Salvar ou Cancelar volta ao verso. Novo processo: Cancelar e Esc fecham a janela; ao cadastrar, a janela se alarga e mostra o verso do processo criado (o endereço passa a ser o dele), com o aviso "Processo cadastrado", e o Quadro ou a Lista atrás recarregam. Falha de gravação com os dados no formulário. Histórico e Editar não têm endereço próprio (recarregar volta ao verso). O diálogo do Novo processo é anunciado como "Novo processo". Spec: `.scratch/processos-etapas/spec.md` (histórias 78, 129 a 131; "Interface", "Verso do cartão", itens Histórico e Novo processo e Editar; "Navegação no endereço"; "Histórico", item Formato; "Decisões de teste", histórico, editar, novo processo e a função pura do agrupamento por dia).

**Blocked by:** 16 (A janela do verso do cartão).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Função pura do agrupamento do histórico por dia ("Hoje", "Ontem", "dd/mm") com testes unitários.
- [x] Histórico dentro da janela, agrupado por dia, com "← Voltar ao processo"; o primeiro Esc volta ao verso e o segundo fecha; "Nenhuma alteração registrada ainda." sem eventos; os textos das ações e as linhas dos recursos retirados continuam como estão.
- [x] Editar na janela, voltando ao verso ao salvar ou cancelar; falha de gravação com os dados no formulário.
- [x] Novo processo na janela, por [Cadastrar processo] e pelo endereço; Cancelar e Esc fecham; ao cadastrar, o verso do criado com "Processo cadastrado", o endereço dele e o Quadro ou a Lista recarregados; falha de gravação com os dados no formulário.
- [x] Recarregar com o Histórico ou o Editar abertos volta ao verso.
- [x] Os testes de tela atuais de cadastrar, editar e histórico do processo passam ajustados à janela, mantendo os comportamentos.
- [x] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [x] `[visual]` O Novo processo e o Editar encolhem a janela para uma coluna de cerca de 560 px, com os botões no rodapé fixo.

Concluído em 2026-10-19 (commit 59bc1a9)
