# Regras de interface — DevFlow v2.0.2

Vale para todo projeto. Leia antes de propor identidade (`/concepcao-*`), de planejar ou executar tela e de polir. Estas regras decidem o que vai na tela; a identidade visual (`.scratch/identidade-visual.md`) decide como ela se parece.

## Princípios

1. **Responda primeiro à pergunta principal.** Toda tela tem uma pergunta que a pessoa trouxe ("em que pé está?", "o que falta?", "cadê o arquivo?"). A resposta vem no topo, sem rolar e sem abrir nada. Escreva essa pergunta na spec, em uma linha, para cada tela.
2. **Revelação progressiva.** Mostre o essencial; o detalhe abre sob demanda (linha que expande, aba, painel). Item que a maioria das pessoas não usa na maior parte das vezes não ocupa a tela inicial.
3. **Uma ação principal por tela.** Um botão com peso de destaque. As demais ações pesam menos.
4. **Ação rara ou destrutiva dentro de um menu** ("⋯"), no fim, com o destrutivo em cor de alerta e confirmação. Excluir nunca tem o mesmo aspecto de Editar.
5. **O botão principal pede o que falta.** Se concluir, enviar ou aprovar exige informação, o próprio botão abre a janelinha que pede (um clique, um registro), em vez de mandar a pessoa a outra seção. A regra de negócio continua no banco ou no código; a interface só guia.
6. **Não repita informação na mesma tela.** O que está no cabeçalho não volta num bloco "Dados". Mostrar o dado duas vezes custa atenção e abre espaço para divergir.
7. **Agrupe por tarefa, não por tabela.** A tela segue o que a pessoa faz, não a estrutura dos dados.
8. **Tela "comigo".** Sistema com responsáveis ou tarefas tem uma visão do que está sob minha responsabilidade agora, do mais parado ao mais recente. É o argumento mais forte contra a planilha: ninguém precisa procurar o que fazer.
9. **Sinal de parado.** Item sem movimento há mais que um limite simples mostra "há N dias" onde a pessoa já olha.
10. **Controles com o estilo da identidade.** Caixa de seleção, seletor de data e botões nativos do navegador destoam do resto; estilize-os ou troque por componente próprio, mantendo teclado e leitor de tela funcionando.
11. **Estados sempre previstos:** carregando, vazio (diz o que fazer a seguir), erro (diz o que houve e como tentar de novo). Os textos-padrão vêm da identidade visual.
12. **Texto curto.** Rótulos de arquivo e de botão curtos; nome longo ou técnico fica em segundo nível. Painel que passa de uma tela e meia de rolagem é sinal para revelação progressiva ou abas.
13. **Responsivo e acessível desde o primeiro ticket:** a tela funciona no computador e na largura de celular, tem foco visível, contraste suficiente e rótulo em todo campo.

## Como aplicar

- **`/projeto` e `/planejar`:** pergunte quem usa a tela e em que situação (computador ou celular, com pressa ou com calma), e o que essa pessoa usa hoje no lugar (planilha, e-mail, papel, outro sistema). Quem usa algo mais simples só troca se a tela nova for mais rápida; isso orienta o que entra e o que fica de fora. Cada tela da spec traz a pergunta principal (princípio 1) e a lista do que fica atrás de "ver mais".
- **`/concepcao-*`:** a identidade já nasce com o estilo dos controles (princípio 10) e com os estados (princípio 11).
- **Antes de planejar mudança numa tela existente:** confira no código que cada controle que a conversa chama de "continua" ainda existe, e que cada elemento citado numa opção visual existe na identidade ou no código.
- **`/polir` e critérios `[visual]` do `/ship`:** conferem a tela aberta na vitrine (abaixo), no computador e na largura de celular.
- **Custo de ciclo:** cada ticket de tela passa por executar, polir e entregar. Ao dividir em tickets, prefira poucos e completos (uma fatia vertical: tela, regra e dados juntos) a muitos pequenos.

## Vitrine

A vitrine é o próprio app rodando com **dados falsos e login falso**, sem banco e sem internet. Serve para ver e conferir telas (no `/executar-*`, no `/polir`, nos critérios `[visual]` do `/ship`) sem depender de usuário, senha nem dados de teste no banco.

- **Como é montada.** O `/setup` cria o script `npm run vitrine` (`vite --mode vitrine --port 5174`) e a entrada `vitrine` no `.claude/launch.json`. No modo `vitrine`, as funções de acesso a dados (um módulo por assunto, regra de "Convenções de Código") devolvem dados inventados de `src/vitrine/` em vez de chamar o banco, e o login devolve um usuário fictício. A escolha é uma só, num ponto único (por exemplo `src/lib/acesso.ts`, que lê `import.meta.env.MODE`).
- **Quem a mantém.** Todo ticket que cria ou muda uma função de acesso a dados acrescenta, no mesmo ticket, a versão falsa dela em `src/vitrine/`, com dados inventados (nunca reais), cobrindo os estados vazio, cheio e erro. Perfil diferente de usuário se escolhe por um parâmetro do endereço (`?perfil=administrador`).
- **Fora de produção.** `src/vitrine/` não entra no build de produção: o modo `vitrine` só existe no `vite --mode vitrine`, e o `/ship` confere que `dist/` não contém a pasta.
- **Ciclo de vida.** A vitrine é mantida entre tickets, não recriada. Encerre o servidor dela ao fim da conferência e feche a pré-visualização antes de comitar.
- Sem banco, a vitrine é o próprio app comum com dados de exemplo; vale a mesma regra de dados inventados.
