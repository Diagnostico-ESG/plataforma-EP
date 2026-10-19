# Reuniões

Status: ready-for-agent

**Como resolve o problema.** A equipe do EP precisa saber, de cada processo, se a reunião de modelagem piloto com o setor já aconteceu ou quando vai acontecer, sem preencher um cadastro de reunião. Cada processo, subprocesso ou item a classificar tem uma data de reunião, que pode ficar vazia. O painel do processo mostra "marcada para", "realizada em" ou "não marcada", e Administrador e Integrante marcam, trocam ou removem a data ali mesmo. Uma reunião que trata vários processos é marcada em cada um. A data não mexe em nenhuma etapa, e toda mudança dela fica no histórico do processo.

Decisões de origem: sabatina de 2026-10-14 (versão anterior, com a área Reuniões), sabatina da parte 1 da iniciativa experiencia-do-quadro (`.scratch/experiencia-do-quadro/sabatina-parte-1.md`, 2026-10-18), ADR 0013 e `CONTEXT.md` (seção "Reuniões"). A versão anterior desta spec (área Reuniões, reunião de sensibilização, participantes, local e anotações) está no histórico do git, no commit ccd2f8b.

## Problema

A primeira versão desta funcionalidade registrava cada reunião com tipo, setor, processos, hora, local, participantes e anotações, numa área própria. Para uma equipe avessa a burocracia, era formulário demais para pouca informação útil: a sensibilização já foi feita para todos os setores, a existência do relatório já prova que a reunião aconteceu, e o que a equipe quer saber de verdade é só "quando foi (ou vai ser) a modelagem piloto deste processo?". Além disso, a reunião ligada ao processo impedia excluí-lo e trocar o setor dele.

## Solução

- **Painel do processo:** a linha "Reunião de modelagem piloto" mostra:
  - "marcada para DD/MM/AAAA", com a data de hoje ou futura;
  - "realizada em DD/MM/AAAA", com a data passada;
  - "não marcada", sem data.
- **Marcar:** Administrador e Integrante escolhem a data num campo de data nativo e clicam [Salvar]; [Remover] apaga a marcação. Vale em qualquer situação do processo (em andamento, suspenso, cancelado ou concluído), como os outros dados dele.
- **Consulta:** vê a linha, sem campo nem botões.
- **Histórico do processo:** marcar, trocar e remover a data viram evento, com autor e momento.
- **Sai da plataforma:** a área Reuniões da faixa lateral, o painel e o formulário da reunião, a seção Reuniões do setor aberto e a do painel do processo, a reunião de sensibilização, participantes, hora, local e anotações.

## Histórias de usuário

### Marcar a reunião

1. Como integrante do EP, quero marcar no painel do processo a data da reunião de modelagem piloto, para a equipe saber quando ela vai acontecer ou aconteceu.
2. Como integrante do EP, quero marcar uma data futura, para registrar a reunião assim que ela é combinada.
3. Como integrante do EP, quero marcar uma data passada, para registrar reuniões que já aconteceram.
4. Como integrante do EP, quero trocar a data marcada, para registrar uma reunião remarcada.
5. Como integrante do EP, quero remover a marcação, para desfazer uma reunião que não vai acontecer ou foi marcada por engano.
6. Como integrante do EP, quero marcar a data num subprocesso e num item a classificar, porque cada um tem a sua modelagem piloto.
7. Como integrante do EP, quero marcar a mesma data em vários processos tratados na mesma reunião, um de cada vez, sem cadastro de reunião.
8. Como integrante do EP, quero marcar a data mesmo com o processo suspenso, cancelado ou concluído, porque é um dado do processo, não uma etapa.
9. Como integrante do EP, quero que o [Salvar] fique desabilitado enquanto o campo estiver vazio ou com a data que já está gravada, para não gravar nada por engano.
10. Como integrante do EP, quero ver uma mensagem clara quando a gravação falhar, com a data que escolhi mantida no campo.

### Ver a reunião

11. Como usuário, quero ver no painel "marcada para DD/MM/AAAA" quando a data é hoje ou futura.
12. Como usuário, quero ver "realizada em DD/MM/AAAA" quando a data já passou.
13. Como usuário, quero ver "não marcada" quando o processo não tem data.
14. Como usuário de perfil Consulta, quero ver a data sem campo nem botões.
15. Como integrante do EP, quero que a data não mude o status de nenhuma etapa, para que marcar a reunião não conclua a Modelagem piloto sem eu querer.

### Histórico

16. Como usuário, quero ver no histórico do processo quem marcou, trocou ou removeu a data e quando, com o antes e depois ("Reunião de modelagem piloto: 14/10/2026 → 20/10/2026").
17. Como usuário, quero que salvar a mesma data não gere evento.
18. Como usuário, quero que os registros antigos de reuniões continuem no histórico geral, numa linha simples ("Registro de reunião (recurso retirado da plataforma)"), porque o histórico nunca se apaga.

### Efeitos nos cadastros

19. Como integrante do EP, quero excluir um processo com data marcada (a data vai junto), respeitando as outras travas (subprocessos e versões).
20. Como integrante do EP, quero trocar o setor de um processo com data marcada, e a data o acompanha.
21. Como integrante do EP, quero excluir um setor sem a trava antiga de reuniões, respeitando a de processos ligados.
22. Como integrante do EP, quero que a reclassificação mantenha a data.
23. Como usuário, quero que a área Reuniões não apareça mais na faixa lateral, e que um endereço antigo dela leve ao Quadro.

### Perfis

24. Como administrador, quero que o banco recuse marcar a data pela Consulta, por usuário inativo e por visitante, mesmo fora da tela.

## Decisões de implementação

### Interface

- **Onde fica:** uma linha no painel do processo, no lugar da antiga seção Reuniões, com o rótulo "Reunião de modelagem piloto". Quadro e Lista não mostram a data (partes 3 e 4 da iniciativa).
- **Texto calculado pela data, na tela:** hoje ou depois → "marcada para"; antes de hoje → "realizada em". "Hoje" é o dia no fuso do navegador.
- **Edição:** campo de data nativo (`date`) com [Salvar] e, quando há data gravada, [Remover]. Remover não pede confirmação: a data volta com dois cliques e o histórico guarda a antiga. Os botões ficam desabilitados durante a gravação.
- **Estados:** a linha chega junto com o processo, então usa o carregando e o erro do painel. Erro de gravação: "A data da reunião não foi salva: {motivo}." em vermelho, com o campo mantido. Recusa por perfil: a mensagem que já existe, "Seu perfil não permite alterar os processos."
- **Módulo de processos:** ganha a operação de marcar a reunião (processo, data ou nada) e devolve a data na leitura do processo. A falsa nomeada passa a guardá-la e aceita falha programável.
- **O que sai:** o módulo de reuniões (tipos, implementação Supabase e falsa, frases), todos os componentes da área Reuniões, as seções no setor aberto e no painel, o item "Reuniões" da faixa lateral e a área `reunioes` do endereço (que passa a levar ao Quadro), e a composição do histórico do processo com eventos de reunião.
- **Histórico:** o rótulo do campo é "Reunião de modelagem piloto", com a data no formato DD/MM/AAAA. Eventos antigos de entidade `reuniao` aparecem no histórico geral como "Registro de reunião (recurso retirado da plataforma)", com data, autor e ação, sem o detalhe.

### Modelo de dados

Migração **destrutiva** (apaga tabelas). Não há produção; só se perdem reuniões inventadas do desenvolvimento, que não são copiadas para a coluna nova (decisão do usuário, ADR 0013). Os eventos antigos ficam em `eventos`.

**Coluna nova em `processos`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `data_da_reuniao` | date | não | data da reunião de modelagem piloto; pode ser futura ou passada; vazia quando não marcada |

Logado ganha o privilégio de alterar a coluna (como as outras editáveis); a RLS de `processos` decide quem pode. O estado do processo guardado nos eventos passa a incluir a data.

**Apagados:** as tabelas `reunioes`, `reunioes_processos`, `reunioes_usuarios` e `reunioes_responsaveis`; o tipo `tipo_de_reuniao`; a função `salvar_reuniao` e todas as funções e gatilhos de reunião, inclusive as travas de excluir setor, de excluir processo e de trocar o setor do processo com reunião (migrações de 2026-10-15). A política de leitura dos eventos de entidade `reuniao` fica, para os registros antigos continuarem legíveis.

**Dado pessoal:** nenhum novo. Saem os nomes de participantes.

#### Quem pode o quê (cada célula vira um teste pgTAP)

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `processos.data_da_reuniao` ler | sim | sim | sim | não | não |
| `processos.data_da_reuniao` marcar, trocar, remover | sim | sim | não | não | não |
| `eventos` antigos de reunião ler | sim | sim | sim | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Data aceita no passado, hoje e no futuro, em qualquer situação do processo | sem restrição de data nem de situação | marcar data futura em processo cancelado aceito |
| Marcar, trocar e remover vira um evento do processo com antes e depois | gatilho de evento do processo, com a data no estado | trocar 14/10 por 20/10 gera um evento com as duas; salvar a mesma data não gera evento |
| A data não muda nenhuma etapa | nenhum gatilho em `andamentos` | marcar a data deixa a Modelagem piloto pendente |
| Processo com data se exclui e troca de setor | travas de reunião apagadas | excluir processo com data aceito; trocar o setor dele aceito, com a data mantida |
| Tabelas de reunião não existem | migração | `has_table` falso para as quatro tabelas |

#### Regras de estado

Nenhuma. "Marcada para" e "realizada em" são calculados pela data, na tela.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).** Vitest com Testing Library, o aplicativo inteiro com a falsa nomeada do módulo de processos. Cobre:
  - os três textos (data futura, hoje, passada, vazia);
  - marcar, trocar e remover, com sucesso e com falha;
  - [Salvar] desabilitado com campo vazio ou data igual;
  - marcar em processo suspenso, cancelado e concluído;
  - Consulta sem campo nem botões;
  - o evento no histórico do processo;
  - a linha genérica dos eventos antigos de reunião no histórico geral;
  - a faixa lateral sem "Reuniões" e o endereço antigo levando ao Quadro;
  - excluir e trocar o setor de processo com data, sem recusa.
  - **Arte anterior:** `App.painelDoProcesso`, `App.historicoDosCadastros` e os testes do painel de processos-etapas.
- **Tradução entre o banco e a tela:** teste pequeno do módulo de processos real com o cliente Supabase simulado, para a data na leitura e na gravação. Arte anterior: `processosSupabase`, `lerProcessoSupabase`.
- **Função pura** do texto ("marcada para", "realizada em", "não marcada") a partir da data e de hoje: teste unitário.
- **Banco:** pgTAP para cada célula e regra acima; os testes `23_reunioes`, `24_reunioes_participantes` e `25_reunioes_nos_cadastros` são apagados ou trocados pelo teste da coluna nova; `00_rls_ligada` e `10_privilegios_padrao` continuam passando. Os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"); a migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os dados dos testes são inventados.

## Fora do escopo

- Área própria de Reuniões, reunião com vários processos num registro só, hora, local, participantes e anotações: entram só se fizerem falta (ADR 0013).
- Data da reunião no cartão do Quadro e na Lista: partes 3 e 4 da iniciativa.
- Concluir a Modelagem piloto ao marcar ou passar a data.
- Copiar as reuniões do desenvolvimento para a coluna nova.
- Lembrete ou convite por e-mail ou calendário.
- Registro de quem consultou (backlog).

## Observações

- **Verso do cartão (2026-10-19, parte 3 da experiencia-do-quadro):** a linha da data passa para a coluna direita do verso do cartão (rótulo "Reunião", data em mono com a barrinha amarela, "· próxima" ou "· realizada"; sem data, "Ainda não marcada"), e "Marcar data" (ou "Alterar data") vira ali mesmo o campo de data com [Salvar], [Remover] e [Cancelar]. O que a data faz não muda. O desenho está na spec de `processos-etapas` ("Verso do cartão"); o critério visual abaixo, sobre "os dados vizinhos do painel", passa a valer para a coluna direita do verso.
- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` A linha "Reunião de modelagem piloto" segue o estilo dos dados vizinhos do painel, com o campo e os botões alinhados a ela.
  - `[visual]` Para a Consulta, a linha não mostra campo nem botões.
  - `[visual]` A mensagem de falha da gravação aparece em vermelho, junto da linha.
- **Divergências com `.scratch/especificacao.md`:** a especificação previa reuniões com processo opcional, participantes e anotações; ficou só a data no processo (ADR 0013).
- **Decisões tomadas ao escrever a spec, a confirmar na leitura:**
  - **Nome da coluna:** `data_da_reuniao`.
  - **Remover sem confirmação**, porque o histórico guarda a data antiga.
  - **Endereço antigo da área Reuniões** leva ao Quadro, em vez de mostrar erro.
  - **A migração não gera eventos** ao apagar reuniões: é mudança de estrutura, registrada no ADR 0013.
- **Rede do escritório:** a migração vai pelo workflow "Migrar banco de desenvolvimento" e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção.

Entregue em 2026-10-15 (commit ccd2f8b), com ressalva: critérios [visual] presumidos (a tela não foi conferida)
Entregue em 2026-10-18 (commit e54f51b)
Em revisão desde 2026-10-19
