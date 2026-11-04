# Linha de etapas do verso só com ícones

Data: 2026-11-04.

Decisão do usuário (demanda no `/demanda`, caminho curto). Muda um ponto da seção "Etapas do verso" da spec de `processos-etapas`: a linha de etapas no topo do verso do cartão deixa de mostrar o nome da etapa e a data (a da última saída nas visitadas, "desde …" na atual) e fica só com a marca de estado e o ícone.

O nome da etapa continua disponível como dica ao passar o mouse (`title`) e no `aria-label` ("{nome}: atual / visitada / ainda não visitada"), que é o que leitor de tela e os testes leem. Nada se perde: a gaveta aberta ao clicar na etapa segue mostrando as entradas e saídas com datas. Nenhum dado nem regra muda; é só o que a linha exibe.

O motivo: a fileira de ícones fica mais limpa; nome e data repetem o que a gaveta e o Agora já dizem.

## Opções consideradas

- **Só ícones, sem nome nem dica:** mais limpo, mas só quem decorou os ícones sabe qual é qual.
- **Tirar a linha inteira:** mexe na gaveta de entradas e saídas, que a spec decidiu e que o usuário quer manter.
