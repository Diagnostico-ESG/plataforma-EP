# Duas revisões em etapas seguidas, e número novo a cada alteração

Data: 2026-11-10.

Decisão do usuário (mudança em revisoes-aprovacao). Altera o ADR 0023 na parte da revisão; a parte da aprovação continua. O ADR 0012 (revisão pelo setor sem rodadas) e o 0043 (manter o [Enviar relatório]) continuam, com o ajuste abaixo.

**Contexto.** No trabalho real há duas revisões, cada uma feita por outro integrante: T ou A revisa o fluxograma técnico feito por V, e depois M revisa o relatório, também feito por V. A plataforma tinha uma etapa só (Revisão interna), com o aviso do revisor olhando só o autor da versão. A equipe também mantinha o número quando a correção era pequena, o que na plataforma só cabia no Substituir, que não guarda o arquivo anterior.

**Decisão.**

- A Revisão interna passa a se chamar **Revisão do fluxograma** (o código interno `revisao_interna` fica), e logo depois dela entra a etapa nova **Revisão do relatório** (`revisao_relatorio`), de campos próprios e na fase VI.
- As duas têm [Registrar revisão] e [Enviar versão] completo, para que uma pessoa só faça, na mesma etapa, as alterações de fluxograma e de relatório (sobretudo na volta depois da Validação com o setor, que pode ir para qualquer uma das duas). Na Revisão do fluxograma, o .bpm é obrigatório; na Revisão do relatório, o relatório é obrigatório e o .bpm é opcional: sem .bpm, nasce só um relatório novo ligado à versão mais recente, e o .png só vai junto com o .bpm. O [Enviar relatório] sai da Revisão do relatório, onde ficaria repetido.
- **Toda alteração, por menor que seja, ganha número novo** (versão ou relatório). Versões e relatórios nunca se apagam, então o anterior fica guardado sem mecanismo novo. O Substituir fica para o arquivo enviado por engano, como combinação da equipe, sem trava.
- No registro da revisão "corrigida", o que foi corrigido (fluxograma, relatório ou ambos) deixa de ser escolhido por quem registra: a plataforma deduz pelo que foi enviado naquela passagem.
- O aviso do revisor compara o responsável com o autor da versão mais recente na Revisão do fluxograma e com o autor do relatório mais recente na Revisão do relatório.

**Alternativas recusadas.** Substituir guardando o arquivo anterior (manteria o "mesmo número" da equipe, mas pediria guardar e mostrar arquivos antigos dentro da versão e deixaria a fronteira entre correção pequena e grande ao julgamento de cada um). Versão de fluxograma sem .bpm na Revisão do relatório (quebraria a regra de que toda versão tem .bpm e faria o número da versão subir sem desenho novo). Tirar o Substituir (todo anexo errado deixaria um número perdido).

**Consequência.** Os números sobem mais rápido que na planilha; o número continua editável. Voltar atrás é fácil: os arquivos ficam todos guardados, e uma substituição com histórico pode ser acrescentada depois sem perder nada.
