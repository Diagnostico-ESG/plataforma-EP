---
description: Implementa em código a identidade visual proposta em /concepcao-livre ou /concepcao-premium, antes de qualquer trabalho funcional — fecha a lacuna entre proposta e código.
---

A proposta de identidade visual aprovada fica em `.scratch/identidade-visual.md` (gravada pelo `/concepcao-livre` ou `/concepcao-premium`). Leia esse arquivo antes de tudo. Se ele não existir mas a proposta estiver nesta conversa, salve-a lá agora, mostre-me o que gravou e peça confirmação de que é a versão aprovada. Se não existir em lugar nenhum, pare e aponte o `/concepcao-livre` ou o `/concepcao-premium`.

A proposta ainda não existe em código — só uma proposta não é suficiente para prosseguir.

Antes de qualquer mudança, crie o marco `marco/AAAA-MM-DD-antes-identidade` (ver "Segurança e Recuperação" no `CLAUDE.md`). Comite antes os arquivos novos de `.scratch/` que ainda não estiverem no git.

Compare o `PRODUCT.md` (criado no `impeccable init`; se não existir, pare e devolva `/impeccable:impeccable init` para eu rodar) com o `.scratch/projeto.md`. Se divergirem em algo que muda a tela (quem usa, tom, exemplos de texto), pare e me pergunte qual vale, e corrija o outro arquivo depois da resposta.

Ative `/impeccable:impeccable shape` (ou a forma curta `/impeccable shape`, se aquela não for reconhecida). Essa skill só faz perguntas e devolve um resumo do escopo para eu confirmar; ela não escreve código. Depois da minha confirmação, implemente pelo fluxo normal do Impeccable: paleta como tokens CSS, tipografia e a estrutura visual proposta, substituindo qualquer boilerplate genérico ainda presente (ex.: conteúdo padrão do template usado para iniciar o projeto, como telas de "Get started" ou instruções de HMR). Reescreva o teste-fumaça do `/setup` para a tela nova: ele deixa de valer quando o contador do template sai, e a cobertura precisa continuar acima do piso.

Se `/impeccable:impeccable shape` recusar ser acionado "nos bastidores", não insista nem simule o fluxo — me devolva o comando pronto para eu rodar manualmente.

**Depois que o código for aplicado, rode a suíte de testes, typecheck e build antes de considerar a etapa concluída.** Mudar tokens/CSS/estrutura não deve quebrar comportamento ou testes já existentes (ex.: validação de formulário, estados de sucesso/erro) — confirme rodando, mesmo quando a mudança parecer só visual. Confira também a tela aberta, no computador e na largura de celular, do jeito descrito em "Conferir a tela" do `/ship`; erros de layout que o conserto de uma revisão cria só aparecem assim.

**Depois da verificação, rode `/mattpocock-skills:code-review` sobre o diff desta mudança.** É model-invoked (diferente de `implement`/`grill-with-docs`/`to-spec`/`to-tickets`), então deve aceitar ser acionada aqui dentro sem recusa — mudança de identidade toca muitos arquivos e merece revisão mesmo sem ter vindo de um ticket. Comite as mudanças antes: o diff da revisão não inclui o que ainda não foi comitado.

Não prossiga para `/planejar` enquanto esta etapa não estiver concluída, verificada e revisada — nenhum trabalho funcional deve começar em cima de uma identidade que só existe como proposta, que quebrou algo sem você saber, ou que nunca foi revisada.

Ao final, crie o marco `marco/AAAA-MM-DD-identidade` (é por ele que o `/planejar` sabe que a identidade já está no código) e lembre explicitamente o próximo passo: no início do projeto, `/planejar` para a primeira funcionalidade da lista em `.scratch/projeto.md`; num redesenho, `/polir` para conferir as telas existentes. Use o modelo da tabela do Funil de Trabalho.
