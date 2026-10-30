# Análise crítica de design: verso do cartão (2026-10-30)

Complementa `.scratch/analise-de-design-2026-10-30.md` e `.scratch/analise-de-design-lista-e-cadastros-2026-10-30.md`, com os conceitos da proposta visual 6 (`.scratch/proposta-visual/proposta-6.html`). Serve de insumo para o pacote 5 da demanda de 2026-10-30 (redesenho do verso do cartão).

Vista no app rodando (localhost, 1440×900), com login do usuário, em dois processos:
- um na etapa Publicação, com 7 versões, relatório e anotações;
- um em Revisão interna, com aviso de revisor.

Partes vistas: topo, "Agora", Etapas, Documentos do Mapeamento, versões anteriores, Outros anexos, Anotações, Sobre, menu "···" e Histórico do processo. Nada foi salvo nem alterado.

Termos conforme o `CONTEXT.md`: **etiqueta** é A fazer, Iniciado ou Finalizado, a marca da etapa atual; **situação do processo** é em andamento, suspenso, cancelado ou concluído.

## Nota geral (heurísticas de Nielsen, 0 a 4)

| # | Heurística | Nota | Principal problema |
|---|---|---|---|
| 1 | Situação visível | 2 | A situação do processo, os dias na etapa e o prazo não aparecem no verso; o histórico de movimento não diz a etapa |
| 2 | Linguagem do usuário | 3 | Dois números de versão lado a lado (V7 do fluxograma e V2 do relatório) sem explicação |
| 3 | Controle e saída | 3 | O histórico abre no lugar do processo e tem "Voltar ao processo"; ok |
| 4 | Consistência | 2 | A versão atual mostra arquivos como "chips"; as anteriores, como links com o nome inteiro |
| 5 | Prevenção de erro | 3 | "Excluir" separado e em vermelho no menu; aviso de revisor dentro do "Agora" |
| 6 | Reconhecer em vez de lembrar | 2 | Histórico escondido no menu "···"; botões que aparecem ou somem conforme a etapa, sem dizer por quê |
| 7 | Eficiência | 2 | Etiqueta em lista suspensa (dois cliques) para três valores |
| 8 | Estética e foco | 2 | Linha das etapas ocupa o topo; sete menus "···"; selo "HISTÓRICA · SOMENTE LEITURA" repetido |
| 9 | Recuperação de erro | 3 | Avisos claros quando aparecem |
| 10 | Ajuda | 2 | Nada explica o "P" e o "F" das versões nem o "Acrescentar .bpmn" |
| | **Total** | **24/40** | **Aceitável** |

## O que funciona

- **O bloco "Agora"** é a ideia certa: diz onde o processo está ("Etapa 7 de 8"), deixa mover e mudar a etiqueta ali mesmo e oferece a **próxima ação da etapa** ("Registrar publicação", "Registrar revisão").
- **O aviso de revisor** ("Fulano enviou a V1; a revisão interna deveria ser de outra pessoa") aparece no lugar e na hora certos.
- **A data de cada etapa** e o "desde 28/10/2026" na etapa atual.
- **O processo tem endereço próprio** e o topo fica fixo ao rolar.
- **O menu "···"** agrupa bem as ações raras e separa "Excluir" em vermelho.
- **Versões nunca somem** e as antigas ficam visíveis. É o princípio "nada se perde" do produto.

## Problemas, por parte

### Topo
1. **Faltam a situação do processo e o tempo.** Suspenso ou em andamento, há quantos dias na etapa, prazo: nada disso aparece. O quadro mostra os dias; o verso, que é a tela de detalhe, não.
2. **Selo do setor no pastel antigo**, só com a sigla. O nome completo fica escondido em "Sobre".

### Bloco "Agora"
1. **Etiqueta numa lista suspensa** com a pílula magenta antiga. São três valores, que cabem em três botões de ícone (○ ◐ ✓) com o selecionado em azul-claro, como na proposta 6: um clique em vez de dois.
2. **Etapa também em lista suspensa**, com a mesma aparência de formulário. Mover é uma ação importante e merece um botão "Mover para ▾" ou o clique direto na trilha de etapas.
3. **Responsável sem rótulo** e sem mostrar como trocar. Só foto e nome.
4. **A próxima ação muda de cara.** "Registrar revisão" aparece em azul cheio; "Registrar publicação" aparece como botão branco. Pela regra da proposta 6, a ação principal da etapa é **o** azul cheio do verso, sempre no mesmo lugar.

### Etapas
1. **A linha vertical das 8 etapas ocupa a melhor área da tela** logo abaixo do "Agora", e repete a etapa atual que o "Agora" já mostra. Depois de feitas, as etapas passadas são consulta, não ação.
2. **"Registrar data" e "Alterar data"** aparecem soltos sob uma etapa, em links pequenos.

Proposta: uma **trilha horizontal** com os ícones das etapas da proposta 6 (feitas em cinza com ✓, atual em azul-claro, futuras vazias), as datas ao passar o mouse, e "Ver datas de todas as etapas" para abrir a lista completa quando precisar.

### Documentos do Mapeamento
1. **Dois desenhos para a mesma coisa.**
   - Na versão atual, os arquivos são "chips" ("Imagem .png ↓ ···").
   - Nas versões anteriores, são links sublinhados com o nome inteiro ("CEE_V6_Elaboração de Expedientes.png").

   Um padrão só: linha com ícone do tipo, nome, botão baixar e menu.
2. **Duas numerações na mesma linha.** O fluxograma está na V7 e o relatório na V2, e os dois chips ficam lado a lado sem explicação. O relatório deveria ter bloco próprio: "Relatório V2, vale para a versão V7 do fluxograma".
3. **Códigos sem legenda.** "V7", "V1P", "V5F", "PILOTO": o P e o F só fazem sentido para quem conhece a convenção. Mostrar "V1 · piloto" e "V5 · final", ou uma dica ao passar o mouse.
4. **"+ Acrescentar .bpmn" em amarelo tracejado** parece aviso de erro, não convite. Deve ser botão discreto ("Adicionar .bpmn").
5. **"HISTÓRICA · SOMENTE LEITURA"** repetido em cada versão antiga. Basta um título "Versões anteriores (somente leitura)" ou um ícone de cadeado.
6. **"Enviar versão" e "Enviar relatório"** aparecem em Revisão interna e somem em Publicação, sem explicação. Se a regra for essa, mostrar o botão desativado com o motivo ao passar o mouse.
7. **Nenhuma prévia do fluxograma.** O PNG da versão atual é a informação mais visual do processo e não aparece. Uma miniatura clicável no topo de "Documentos" resolveria.
8. **Metadados em 10px** ("Alex Sandro de Macedo · Modelagem piloto"): quase ilegíveis.

### Coluna direita (Anotações e Sobre)
1. **Anotações ocupa a melhor posição da direita**, com o processo sem anotação nenhuma no segundo exemplo. "Alterado em 29/10, 21:06" não diz por quem.
2. **"Sobre" é magro.** Mostra setor (só sigla), macroprocesso e tipo, e deixa um vazio grande abaixo. É o lugar natural para:
   - responsável, com o botão "Trocar";
   - dias na etapa e prazo;
   - E-protocolo;
   - setores envolvidos;
   - o nome completo do setor.

### Menu "···" e Histórico
1. **Histórico escondido no menu**, ao lado de Editar, Suspender e Excluir. "Nada se perde" é um princípio do produto: o histórico deveria ser uma aba visível.
2. **Possível defeito: o histórico de movimento não diz a etapa.** Os registros "Moveu o processo" mostram, em "Antes" e "Depois", só o nome do processo e o responsável, iguais nas duas linhas. Não aparece de qual etapa para qual. Pode ser o dado gravado ou a forma de exibir; precisa ser conferido, porque essa é justamente a informação que o histórico existe para guardar.
3. **"Antes/Depois" despeja campos** em vez de destacar só o que mudou. É o mesmo ponto do histórico dos cadastros.
4. **Esc não fechou o menu "···".** No meu teste, o menu continuou aberto depois de apertar Esc. Não é crítico, mas foge do esperado.
5. **Sete menus "···" no verso.** Um no topo, um por versão e um por arquivo, com até três "···" numa mesma linha de arquivos. Baixar já tem ícone próprio; o menu do arquivo pode ir para um só lugar, ou aparecer só ao passar o mouse.

### Carregamento
Já registrado na primeira análise: ao abrir, a janela fica transparente por um instante e o quadro aparece através dela.

## Estrutura proposta (conceitos da proposta 6)

1. **Topo fixo:**
   - selo do setor vivo com o nome do processo;
   - etiqueta de situação só quando não for "em andamento" (Suspenso, Concluído, Cancelado);
   - à direita, a **ação principal da etapa** em azul cheio (Registrar revisão, Registrar publicação, Enviar versão…) e o menu "···".
2. **Trilha das etapas**, horizontal, com ícones. A atual fica em azul-claro, com "desde 28/10 · 2 dias".
3. **Abas** (selecionada em azul-claro): **Visão geral**, **Documentos (n)**, **Revisões**, **Histórico**.
4. **Visão geral:**
   - **à esquerda, "Agora":** etapa, etiqueta em três botões de ícone, responsável com "Trocar" e pendências como avisos com ícone;
   - **à direita, "Dados":** setor por extenso, macroprocesso, tipo, prazo, E-protocolo, setores envolvidos;
   - **embaixo:** Anotações, com quem alterou e quando.
5. **Documentos:**
   - **versão atual:** cartão com a miniatura do fluxograma e os arquivos em linhas (ícone do tipo, nome, baixar);
   - **relatório:** bloco próprio, dizendo a qual versão vale;
   - **versões anteriores:** tabela compacta (versão, data, quem, etapa, arquivos), com cadeado;
   - **outros anexos:** no fim.
6. **Histórico:** no padrão do histórico dos cadastros, só o campo que mudou, com antes riscado e depois em negrito, e a etapa sempre de → para.

## Prioridades

1. **[P1]** Conferir e corrigir o histórico de movimento sem a etapa.
2. **[P1]** Hierarquia do topo:
   - situação, dias e prazo à vista;
   - ação da etapa sempre em azul cheio no mesmo lugar;
   - trilha horizontal no lugar da lista vertical de etapas.
3. **[P1]** Documentos:
   - um padrão de arquivo só;
   - relatório separado e explicado;
   - legenda de P e F;
   - prévia do fluxograma.
4. **[P2]** Abas, com o Histórico visível fora do menu.
5. **[P2]** Etiqueta em três botões de ícone; responsável com rótulo e "Trocar".
6. **[P2]** Coluna "Dados" completa; Anotações com autor.
7. **[P3]** Menos menus "···"; "Adicionar .bpmn" sem amarelo; selo "histórica" uma vez só; Esc fechando o menu.
