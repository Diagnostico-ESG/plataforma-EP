# Sabatina — parte 1 (Simplificação), 2026-10-18

Muda `processos-etapas` e `reunioes`. Decisões do usuário (todas as recomendações aceitas). Porquê geral: ADR 0013.

1. **Data da reunião no próprio item:** um campo de data, opcional, em processo, subprocesso e a classificar (cada um tem a sua). As tabelas de reuniões deixam de existir.
2. **Apagar por migração nova:** reuniões, ligação reunião–processo, participantes (usuários e responsáveis), responsáveis do setor e os andamentos das três etapas do setor, com funções, gatilhos e testes ligados a eles. Dados do desenvolvimento são inventados; a produção não existe.
3. **Histórico:** os eventos antigos de reunião, responsável do setor e andamento de etapa do setor ficam (o histórico nunca se apaga); a tela os mostra numa linha genérica, ex.: "Registro de reunião (recurso retirado da plataforma)".
4. **Catálogo:** sai o nível (tela e banco); as etapas restantes ficam numeradas de 1 a 6; "Reunião de modelagem" passa a "Modelagem piloto", com o código `modelagem` mantido.
5. **Travas:** sai a que impedia excluir processo tratado em reunião e a que impedia trocar o setor dele. Continuam as de subprocesso e de versão.
6. **Quem marca:** Administrador e Integrante marcam, trocam e removem a data em qualquer situação do processo (mesma regra dos dados dele); Consulta só vê.
7. **No painel do processo:** linha "Reunião de modelagem piloto": data de hoje ou futura → "marcada para DD/MM/AAAA"; passada → "realizada em DD/MM/AAAA"; vazia → "não marcada". Edição com campo de data nativo, [Salvar] e [Remover]. Quadro e Lista não mostram a data (partes 3 e 4).
8. **Histórico da data:** marcar, trocar ou remover vira evento do processo ("Reunião de modelagem piloto: antes → depois"), com autor e momento.
9. **Saem das telas:** área Reuniões do menu; seções Etapas do setor, Responsáveis do setor e reuniões da página do setor; etapas do setor e seção Reuniões do painel do processo; coluna e filtro "Aguardando o setor" (processo novo entra direto em Modelagem piloto); campo Nível do catálogo; rótulos de responsável do setor e reunião no histórico dos cadastros. Conferir no código, ao escrever a spec, se há outro lugar.
10. A data não muda o status de nenhuma etapa (CONTEXT.md, "Reunião").
