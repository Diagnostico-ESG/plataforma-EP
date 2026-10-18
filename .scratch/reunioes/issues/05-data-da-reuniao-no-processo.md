# 05: Data da reunião no processo, sem a área Reuniões

**Como resolve a sua parte.** A equipe só quer saber se a modelagem piloto de cada processo já aconteceu ou quando vai acontecer, sem preencher um cadastro de reunião. Este ticket troca a área Reuniões por uma linha no painel do processo, com a data marcada, trocada ou removida ali mesmo, e tira as travas que impediam excluir ou trocar o setor de um processo tratado numa reunião.

**What to build:** a linha "Reunião de modelagem piloto" no painel do processo (marcada para, realizada em, não marcada), editável por Administrador e Integrante em qualquer situação do processo, com evento no histórico do processo; a saída da área Reuniões, das seções de reuniões do setor aberto e do painel, do módulo de reuniões e das travas ligadas a reunião; a linha simples dos eventos antigos de reunião no histórico. Spec: `.scratch/reunioes/spec.md` (inteira; versão de 2026-10-18). Porquê: ADR 0013.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: migração nova apaga as tabelas, o tipo, a função de salvar, os gatilhos e as travas de reunião, e acrescenta `processos.data_da_reuniao` (opcional), com a alteração concedida a logado e a data no estado dos eventos do processo.
- [ ] Banco (pgTAP, antes da migração): Administrador e Integrante marcam, trocam e removem a data; Consulta, inativo e visitante recusados; data futura em processo cancelado aceita; trocar a data gera um evento com antes e depois; salvar a mesma data não gera evento; marcar a data deixa a Modelagem piloto pendente; processo com data se exclui e troca de setor; as quatro tabelas de reunião não existem; eventos antigos de reunião legíveis por todo perfil ativo. Os testes 23, 24 e 25 apagados ou trocados; `00_rls_ligada` e `10_privilegios_padrao` verdes.
- [ ] Painel: "marcada para DD/MM/AAAA" (hoje ou futura), "realizada em DD/MM/AAAA" (passada), "não marcada" (vazia); campo de data nativo com [Salvar] (desabilitado vazio ou com a data igual) e [Remover] (só com data gravada, sem confirmação); falha em vermelho com o campo mantido.
- [ ] Consulta vê a linha sem campo nem botões.
- [ ] Histórico do processo: "Reunião de modelagem piloto: antes → depois", com autor e momento. Eventos antigos de reunião no histórico geral como "Registro de reunião (recurso retirado da plataforma)".
- [ ] Saem: o item "Reuniões" da faixa lateral (endereço antigo leva ao Quadro), a área, o painel e o formulário da reunião, as seções de reuniões do setor aberto e do painel, o módulo de reuniões (falsa e Supabase) e a composição do histórico do processo com eventos de reunião.
- [ ] Excluir e trocar o setor de processo com data, sem recusa de reunião.
- [ ] Função pura do texto da data com teste unitário; teste do módulo de processos real (data na leitura e na gravação); testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `supabase/AMBIENTES.md` registra a migração.
