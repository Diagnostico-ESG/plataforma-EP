# Revisão de segurança do código — DevFlow v3.3

Usada pelo passo 4 do `/ship` e pelo passo 7 da revisão para produção (`producao.md`). Substitui o `/security-review` embutido do Claude Code como padrão. Aquele comando só eu posso digitar, compara a branch atual com a principal e, no fluxo do DevFlow, quase sempre chega com diff vazio (o trabalho já está na principal) ou parcial (vê só o que ainda não foi enviado ao GitHub); em um mês de uso, a revisão de reserva acabou fazendo o trabalho em quase todas as entregas, e o relatório do comando vinha em inglês.

## O que revisar

- **No `/ship`:** o diff desde o marco de início da funcionalidade (`git diff <marco>...HEAD`), ou desde o marco do passo 0 quando o `/ship` cobre várias. Mudanças não comitadas ficam fora: comite antes.
- **Na revisão para produção:** o código inteiro, por pasta (`src/`, `supabase/migrations/`, `supabase/functions/`).

## Como

1. Faça antes as **checagens da interface** do passo 4 do `/ship` (busca por `dangerouslySetInnerHTML`, `innerHTML`, `target="_blank"` e o resto da lista).
2. Rode a revisão num **subagente só de leitura**, que recebe o diff (ou as pastas), a lista de foco abaixo e o pedido de devolver cada achado com arquivo e linha, o cenário de ataque concreto (quem faz o quê, e o que consegue) e uma nota de confiança de 1 a 10.
3. **Filtre você** o que voltar, lendo o código, as políticas e as permissões (`grant`) envolvidas. Fica só o achado com confiança 8 ou mais e cenário de ataque possível neste projeto. Sai: o que exige acesso que o atacante já não teria, a falta de limite de requisições, ataque de negação de serviço, dependência de terceiros (é do passo 3), boas práticas sem exploração concreta e o que a RLS já barra no banco (confira a política antes de descartar).
4. Para cada achado real: corrija com um teste que prove a correção (vendo o teste falhar antes). Para cada descartado que pareceu sério, uma frase em linguagem simples dizendo por que não é problema.

## Lista de foco

- **Login e permissões:** política de RLS que deixa um perfil ver ou mudar o que não devia; dado que a própria pessoa altera pela API do login (`raw_user_meta_data`) e que um gatilho ou política usa como se fosse confiável; usuário desativado que continua agindo; visitante sem login; função `security definer` em schema exposto ou sem `search_path` vazio; view sem `security_invoker = true`.
- **Dado que chega de fora** (formulário, arquivo enviado, parâmetro de endereço, armazenamento do navegador, resposta de API externa): validação só na tela e não no banco; texto que vira HTML, endereço ou consulta sem tratamento; arquivo enviado aberto como HTML ou SVG.
- **Chaves e dados pessoais:** chave secreta no código, no `seed.sql`, no histórico do git ou numa variável que vai ao navegador; dado pessoal em log, em mensagem de erro ou numa URL; URL assinada guardada em vez de gerada na hora.
- **Edge Functions:** função que usa a chave secreta sem conferir antes quem chamou (logado, ativo, com o perfil exigido); CORS aberto a qualquer site.
- **Arquivos:** bucket público; versão que pode ser apagada ou trocada quando a spec diz que não.

## O relatório

Em português, no relatório do `/ship` e, se houve achado, no `desvios.md`: o que foi revisado (do marco X ao commit Y, ou as pastas), quantos achados ficaram depois do filtro, o que foi corrigido e com qual teste, e o que foi descartado e por quê.

## Se eu quiser a segunda opinião

O `/security-review` continua disponível. Ele só ajuda quando o trabalho está numa branch ainda não integrada à principal e a principal do GitHub está em dia. Se eu o rodar, trate os achados dele pelo mesmo filtro do passo 3.
