# 02: Confirmação de arquivos: enviar agora

**What to build:** a pergunta da confirmação de arquivos ganha [Enviar arquivos agora], o botão principal, que abre a janela de envio de hoje (a da trava) com o formulário do que falta na primeira etapa da lista. Depois do envio, a tela relê o processo: se ainda faltar algo, a pergunta volta só com o que sobrou; se não, o movimento segue (chegada a Concluídos, quando é o destino, e a gravação). Regras na seção "Travas em avisos" da spec de `documentos-versoes` (histórias 139, 140, 148 e 149; decisão 6).

**Blocked by:** 01 (Confirmação de arquivos: avançar ou cancelar)

**Status:** ready-for-agent

- [ ] [Enviar arquivos agora] é o botão principal da pergunta e abre a janela de envio da primeira etapa que falta.
- [ ] A janela de envio passa a ter o título "Enviar os arquivos da {etapa}" e o botão [Enviar e continuar]; mantém o formulário e os estados de hoje.
- [ ] Envio de uma parte: a pergunta volta só com o que sobrou (a outra etapa ou a outra peça); envio de tudo: o processo se move.
- [ ] Destino Concluídos: a chegada (data da publicação ou explicação) vem depois do envio completo.
- [ ] Falha no envio: a mensagem aparece, nada se move e o que foi escolhido não se perde.
- [ ] Falha no movimento depois do envio: "Os arquivos foram enviados, mas o processo não foi movido."
- [ ] Funções puras (`moverDepoisDoEnvio` e a de etapas que faltam) com teste; testes `App.*` cobrindo os casos acima, pela lista do Agora e ao arrastar.
