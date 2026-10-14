# Desvios — processos e etapas

## 2026-10-14 — /executar-complexo do ticket 04 (cadastro de processos e Quadro)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para os tickets seguintes.

- **Painel continua aberto depois de editar.** A spec não diz o que acontece ao salvar a edição. O painel volta aos dados, já atualizados, e o Quadro atrás recarrega (cadastrar e excluir fecham o painel).
- **Andamentos de processo só se leem até o ticket 05.** A política de alteração de `andamentos` passou a exigir `setor_id is not null`. Sem isso, a sequência das etapas do processo não seria imposta (os gatilhos `preparar_andamento` e `registrar_evento_do_andamento` ainda conhecem só o andamento de setor). **O ticket 05 precisa reescrever os dois gatilhos para processo e relaxar a política.** O teste 17 desliga `registrar_evento_do_andamento` dentro da transação para montar o estado da view; o ticket 05 deve tirar esse desvio.
- **Frases no singular.** "Não é possível excluir: setor tem 1 processo ligado." e "O setor TSA tem 1 processo neste macroprocesso; mova-o ou exclua-o antes." (a spec dá só o plural).
- **Textos novos da conferência na tela:** "O nome do processo é obrigatório.", "Escolha o setor do processo.", "Escolha o macroprocesso do processo." (a spec só diz "obrigatórios").
- **Tipo e pai fora dos privilégios.** `tipo` e `processo_pai_id` ficam fora do `update` (e o pai fora do `insert`): a mudança direta é recusada com 42501. O ticket 08 abre o caminho da reclassificação (a spec previa gatilho com função; a recusa por privilégio é mais simples e já prova a regra).
- **Situação e motivo sem escrita.** `situacao` e `motivo_da_situacao` existem, com a restrição de coerência, mas nenhum privilégio de escrita até o ticket 07.
- **Recusas de exclusão por gatilho "antes de apagar"** (`conferir_*`, nome antes de `registrar_exclusao_*`), com a contagem; a referência composta com `on delete restrict` fica de reserva.
- **Teste de tela por recusa de exclusão:** as três frases são provadas no módulo (`recusasDeProcessos.test.ts` e os `*Supabase.test.ts`); na tela, os testes de exclusão de setor e de macroprocesso já provam que a frase pronta da recusa aparece em vermelho (o de setor passou a usar a frase da spec).
- **Quadro:** a área interna continua `quadro`; o endereço passou a `#/processos`. `#/processos/lista` cai no Quadro até o ticket 09. A alternância Quadro | Lista da barra superior segue como estava.
- **Conferência visual não feita nesta sessão.** O app exige login no Supabase e não há servidor de visualização com dados; Quadro, painel e formulário só foram conferidos por teste de tela. Os critérios `[visual]` da spec ficam para o `/polir` e o `/ship`.
