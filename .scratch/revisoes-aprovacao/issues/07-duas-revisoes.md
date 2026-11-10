# 07: Duas revisões

Status: ready-for-agent
Depende de: nenhum (pode começar já)

**Como resolve a sua parte.** É a seção "Duas revisões" da spec inteira, numa entrega só (decisão do usuário em 2026-11-10; ADR 0046). A Revisão interna passa a se chamar Revisão do fluxograma, e logo depois dela entra a Revisão do relatório, onde M revisa o relatório de V. Cada revisão tem o seu [Registrar revisão] e o seu [Enviar versão]: na do relatório, o relatório é obrigatório e o .bpm opcional, para que quem revisa faça ali mesmo as alterações do fluxograma e do relatório, sem mover o processo. O que foi corrigido sai do que foi enviado na passagem, e o aviso do revisor compara com o autor do que se revisa. Toda alteração ganha número novo; o Substituir fica para o arquivo enviado por engano.

Ordem sugerida, por depender uma parte da outra: a migração da etapa e do limite de envio (com os testes de banco), os tipos, os envios na tela; depois a migração do registro da revisão (com os testes), os tipos e a tela do registro.

- [ ] Nome novo da Revisão do fluxograma em todas as telas (critério 1 da spec)
- [ ] Revisão do relatório no catálogo, na fase VI, de campos próprios (critério 2)
- [ ] [Enviar versão] da Revisão do relatório: só relatório, relatório com .bpm, recusa sem relatório e .png só com .bpm (critérios 3, 4 e 5)
- [ ] [Enviar relatório] só fora da Revisão do relatório; Revisão do fluxograma como hoje (critérios 6 e 7)
- [ ] Banco recusa versão e relatório da Validação com o setor em diante (critério 8)
- [ ] [Registrar revisão] nas duas etapas, com "sem alteração" e "corrigida" e o escopo deduzido (critérios 9 e 10)
- [ ] Aviso do autor do relatório e "Sem … para revisar." (critérios 11 e 12)
- [ ] Gaveta de cada revisão e histórico com o nome da revisão (critérios 13 e 16)
- [ ] Confirmação nova do Substituir (critério 14)
- [ ] Importação leva "Revisão Interna" à Revisão do relatório (critério 15)
- [ ] Consulta, suspenso e cancelado (critério 17)
- [ ] `[visual]` Ícone, Agora da Revisão do relatório e formulário de versão (critérios 18, 19 e 20)
- [ ] Testes de banco antigos ajustados (lista em "Testes de banco antigos que podem quebrar")
