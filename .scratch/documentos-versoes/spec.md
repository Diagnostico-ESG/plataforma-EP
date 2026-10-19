# Documentos e versões

Status: ready-for-agent

**Como resolve o problema.** Hoje os fluxogramas (.bpmn, .png e o .bpm do Bizagi) e os relatórios de cada processo ficam em pastas e e-mails, sem numeração confiável, sem saber quem enviou o quê e quando, e sem ligação com o andamento do processo. Com esta funcionalidade, o painel do processo ganha a seção **Versões**: a equipe envia cada versão (V1, V2…) com o .bpmn e o .png, o .bpm opcional e o relatório, junto ou depois; registra as versões históricas da primeira etapa do trabalho (V5F); acrescenta o relatório que ficou pendente ou marca "sem alteração de conteúdo"; substitui um arquivo enviado por engano; e baixa qualquer arquivo com o nome padrão (`CEE_V6_Nome do processo`). Os arquivos ficam no Drive compartilhado do CED, numa pasta aberta à equipe e organizada por setor e processo; a plataforma entra no Drive por uma conta de serviço do EP, cuja chave fica só numa função do servidor, e o banco guarda apenas os dados de cada arquivo. A plataforma avisa quando um arquivo foi alterado ou apagado direto no Drive. O banco impõe as regras (numeração, versão histórica só antes da primeira nova, processo em andamento, quem pode) e toda mudança entra no histórico do processo.

Decisões de origem: sabatina de 2026-10-15 (`.scratch/documentos-versoes/sabatina.md`), `CONTEXT.md` (seção "Documentos") e ADRs 0005 (versão do processo com os arquivos dentro), 0006 (envio não muda a etapa), 0007 (arquivo se substitui sem guardar o anterior) e 0008 (arquivos no Drive compartilhado por conta de serviço).

## Problema

O EP produz, para cada processo, uma sequência de fluxogramas e relatórios: o piloto depois da reunião de modelagem, a versão técnica com o relatório, as correções da revisão interna. Hoje esses arquivos ficam espalhados, a numeração é feita à mão no nome do arquivo, e não se sabe com segurança qual é a versão mais recente, quem a enviou, em que etapa do trabalho, nem se o relatório daquela versão já existe. Os arquivos da primeira etapa do trabalho (V5F) também precisam continuar valendo, e a numeração nova tem de continuar a partir deles. A instituição quer os arquivos no seu próprio Drive, onde a equipe também consegue abri-los direto.

## Solução

- **Seção Versões no painel do processo** (e do subprocesso, que tem as suas):
  - a lista das versões, da mais recente para a mais antiga, cada uma com o rótulo (V7, ou V5F na histórica), data e hora do envio, quem enviou, a etapa em que foi enviada (a histórica não tem), a observação da mudança e os arquivos (.bpmn, .png, .bpm, relatório), cada um com o nome padrão e um link que baixa o arquivo;
  - a marca **"relatório pendente"** na versão nova sem relatório;
  - as marcas **"alterado fora da plataforma"** e **"não encontrado no Drive"** no arquivo que mudou ou sumiu no Drive;
  - para Administrador e Integrante, com o processo em andamento: [Enviar versão]; [Registrar versão histórica], enquanto não houver versão nova; em cada versão com relatório pendente, [Acrescentar relatório] e [Sem alteração de conteúdo]; em cada arquivo de versão nova, [Substituir].
- **Enviar versão:** um formulário no painel com os campos de arquivo .bpmn e .png (obrigatórios), .bpm (opcional), relatório .docx ou .pdf (opcional) e a observação (opcional). Mostra o número que a versão vai receber e o nome que cada arquivo vai ter. Confere os arquivos antes de enviar, mostra o progresso ("Enviando 2 de 3…") e só registra a versão depois que todos chegaram ao Drive.
- **Registrar versão histórica:** o mesmo formulário com o número digitado (5 vira V5F) e os arquivos que existirem (basta o .bpm, ou o .bpmn com o .png; relatório opcional).
- **Acrescentar relatório:** escolhe a versão (a mais recente com relatório pendente vem escolhida) e envia o .docx ou o .pdf.
- **Sem alteração de conteúdo:** na versão nova com relatório pendente, registra o relatório da versão anterior com o nome da versão nova, com um clique de confirmação.
- **Substituir:** troca um arquivo da versão por outro do mesmo tipo, com confirmação que avisa que o anterior não fica guardado.
- **Baixar:** o link de cada arquivo traz o arquivo pela plataforma e o abre numa aba nova (ou baixa, se o navegador bloquear a aba), com o nome padrão.
- **Histórico do processo:** ganha os eventos de versão enviada, versão histórica registrada, relatório acrescentado, sem alteração de conteúdo e arquivo substituído.

A Consulta vê a seção e baixa os arquivos, sem nenhum botão de alteração, e não precisa ser membro do Drive. Quem não pode alterar é recusado pela função do servidor e pelo banco, mesmo que tente fora da tela.

## Histórias de usuário

### Enviar uma versão

1. Como integrante do EP, quero enviar o fluxograma de um processo (.bpmn e .png), para que a versão fique registrada com número, data e autor.
2. Como integrante do EP, quero que o número da versão seja dado pela plataforma, continuando a numeração do processo (inclusive a das versões históricas), para não errar a numeração à mão.
3. Como integrante do EP, quero ver, antes de enviar, o número que a versão vai receber e o nome de cada arquivo, para conferir o que vai ser gravado.
4. Como integrante do EP, quero enviar o .bpm do Bizagi junto, se tiver, para guardar o arquivo-fonte.
5. Como integrante do EP, quero enviar o relatório junto com o fluxograma, quando ele já estiver pronto, para não precisar de um segundo envio.
6. Como integrante do EP, quero escrever uma observação curta sobre o que mudou na versão, se quiser.
7. Como integrante do EP, quero que a versão registre sozinha a etapa em que o processo está, para saber depois se ela foi o piloto, a técnica ou a correção da revisão.
8. Como integrante do EP, quero que o envio não mexa nas etapas, para que o andamento continue sendo decidido por mim.
9. Como integrante do EP, quero que o botão de enviar fique desabilitado enquanto faltam o .bpmn ou o .png, para saber o que falta.
10. Como integrante do EP, quero ser avisado antes do envio se escolhi um arquivo com extensão errada, maior que 20 MB, um .png que não é imagem ou um .bpmn que não é BPMN, para não gravar o arquivo errado.
11. Como integrante do EP, quero ver o progresso do envio, para saber que a plataforma está trabalhando.
12. Como integrante do EP, quero que, se algum arquivo falhar, a versão não seja registrada e eu veja uma mensagem clara, sem perder o que preenchi, para tentar de novo.
13. Como integrante do EP, quero enviar uma versão mesmo sem ser o responsável da etapa atual, para que qualquer integrante possa registrar o trabalho.

### Versões históricas

14. Como integrante do EP, quero registrar as versões da primeira etapa do trabalho (V5F), para que o histórico do processo comece de onde ele realmente começou.
15. Como integrante do EP, quero digitar o número da versão histórica, para seguir a numeração que os arquivos já tinham.
16. Como integrante do EP, quero registrar uma versão histórica só com o .bpm, quando for o único arquivo que existe.
17. Como integrante do EP, quero registrar várias versões históricas (V3F, V4F, V5F).
18. Como integrante do EP, quero que a primeira versão nova continue a numeração (V5F → V6).
19. Como integrante do EP, quero que a plataforma recuse uma versão histórica depois que o processo já tem versão nova, para a numeração não se embaralhar.
20. Como integrante do EP, quero que a plataforma recuse um número de versão histórica que já existe no processo.
21. Como usuário, quero ver a versão histórica com o sufixo F e sem a etapa, e saber que ela é somente leitura.

### Relatório

22. Como integrante do EP, quero acrescentar o relatório a uma versão que ainda não tem, para completar a versão quando ele ficar pronto.
23. Como integrante do EP, quero que a versão mais recente com relatório pendente venha escolhida, e poder escolher outra mais antiga.
24. Como integrante do EP, quero ver a marca "relatório pendente" nas versões novas sem relatório, para não esquecer de enviá-lo.
25. Como integrante do EP, quero marcar "sem alteração de conteúdo" quando o relatório não mudou de uma versão para a outra, para que a versão nova tenha o relatório com o número certo sem que eu precise enviá-lo de novo.
26. Como integrante do EP, quero que "sem alteração de conteúdo" só apareça quando a versão anterior tem relatório.
27. Como usuário, quero ver na versão que o relatório veio de "sem alteração de conteúdo" e de qual versão.

### Substituir arquivo

28. Como integrante do EP, quero substituir um arquivo enviado por engano, sem criar versão nova, porque o conteúdo do trabalho não mudou.
29. Como integrante do EP, quero ser avisado, antes de confirmar, que o arquivo anterior não fica guardado.
30. Como integrante do EP, quero que o arquivo novo passe pelas mesmas conferências do envio e seja do mesmo tipo do que sai.
31. Como integrante do EP, quero que o histórico registre a troca, com quem, quando, qual arquivo e o nome e a impressão digital (hash) do que saiu, para saber depois que o arquivo mudou.
32. Como integrante do EP, quero que a versão histórica não tenha [Substituir].

### Baixar e abrir

33. Como usuário (inclusive Consulta), quero baixar qualquer arquivo de qualquer versão, com o nome padrão, sem precisar ser membro do Drive.
34. Como usuário, quero que o arquivo abra numa aba nova quando o navegador sabe mostrá-lo (.png, .pdf), e seja baixado nos outros casos.
35. Como usuário, quero ver uma mensagem clara quando o arquivo não puder ser baixado (sem conexão, arquivo apagado no Drive).

### Arquivos no Drive

36. Como integrante do EP, quero encontrar os arquivos no Drive compartilhado do CED, numa pasta por setor e por processo, com os nomes padrão, para abri-los direto quando precisar.
37. Como integrante do EP, quero que o subprocesso tenha a sua pasta dentro da pasta do setor dele.
38. Como integrante do EP, quero que, quando o processo for renomeado ou o setor mudar de sigla ou o processo mudar de setor, a pasta acompanhe, e os arquivos mantenham o nome da época.
39. Como integrante do EP, quero ver a marca "alterado fora da plataforma" quando alguém mudou o arquivo direto no Drive, e "não encontrado no Drive" quando ele sumiu, para não confiar num registro desatualizado.
40. Como administrador, quero que o desenvolvimento use um Drive separado do oficial, para que nenhum teste toque os arquivos reais.

### Perfis e situação

41. Como usuário da Consulta, quero ver a seção Versões e baixar os arquivos, sem nenhum botão de alteração.
42. Como integrante do EP, quero que enviar, registrar histórica, acrescentar relatório, marcar sem alteração e substituir só funcionem com o processo em andamento; suspenso, cancelado ou concluído só permite consultar e baixar.
43. Como administrador, quero que a função do servidor e o banco recusem quem não pode, mesmo que a pessoa tente fora da tela.
44. Como usuário inativo, não devo conseguir ver nem baixar nada.

### Histórico e efeitos

45. Como usuário, quero ver no histórico do processo cada versão enviada, versão histórica registrada, relatório acrescentado, sem alteração de conteúdo e arquivo substituído, com autor e data.
46. Como integrante do EP, quero que a plataforma recuse excluir um processo que tem versões, dizendo quantas, para não perder o vínculo com os arquivos.
47. Como integrante do EP, quero que a reclassificação (processo ↔ subprocesso) mantenha as versões no item.
48. Como integrante do EP, quero que trocar o setor ou renomear o processo continue permitido com versões, e que os arquivos já enviados mantenham o nome com que foram enviados.

### Estados da tela

49. Como usuário, quero ver "Carregando…" enquanto as versões chegam, "Nenhuma versão enviada." quando não há nenhuma, e uma mensagem com [Tentar de novo] quando a leitura falha.
50. Como usuário, quero que a seção funcione mesmo quando a conferência com o Drive falha, com um aviso discreto de que os arquivos não puderam ser conferidos.

## Decisões de implementação

### Interface

- **Seção Versões** no painel do processo, no estilo das seções vizinhas (Reuniões, Subprocessos), entre o caminho de etapas e o histórico. Lista de versões da mais recente para a mais antiga; cada versão é um bloco com cabeçalho (rótulo, data e hora, autor, etapa, marcas) e a lista dos arquivos, cada um com o nome padrão como link de download e, quando cabe, [Substituir].
- **Rótulo:** `V{número}` na versão nova, `V{número}F` na histórica.
- **Formulários** (enviar versão, versão histórica, acrescentar relatório, substituir) abrem no painel, no padrão do formulário de reunião. Campos de arquivo nativos (`input type="file"` com `accept`), um por papel. O botão de enviar fica desabilitado enquanto falta arquivo obrigatório ou alguma conferência falhou; cada conferência que falha mostra a mensagem ao lado do campo.
- **Sem alteração de conteúdo** e **substituir** usam a janela de confirmação que já existe.
- **Estados da seção:**
  - **carregando:** "Carregando…";
  - **sem dados:** "Nenhuma versão enviada." (com os botões para quem pode);
  - **erro, inclusive falha de conexão:** "Não foi possível carregar as versões. Verifique a conexão e tente de novo." com [Tentar de novo], no padrão de `ErroAoCarregar`;
  - **conferência com o Drive falhou:** a lista aparece normalmente, com o aviso "Não foi possível conferir os arquivos no Drive." e sem as marcas de alteração;
  - **envio em andamento:** "Enviando 2 de 3…", com os campos travados;
  - **falha no envio, no download ou recusa:** mensagem em vermelho, sem perder o que foi preenchido.
- **Recusas:** cada recusa chega como código (da função ou do banco) e vira mensagem na tela, no padrão de `recusasDeReunioes`: perfil sem permissão, processo fora de andamento, versão histórica depois de versão nova, número histórico repetido, versão sem .bpmn ou .png, histórica sem arquivo de fluxograma, relatório já existente, versão anterior sem relatório (no "sem alteração"), substituir em versão histórica, tipo de arquivo diferente na substituição, extensão não aceita, arquivo maior que 20 MB, Drive sem espaço, e na exclusão do processo a contagem de versões.
- **Histórico do processo:** os eventos de versão entram na lista de eventos que já existe, com textos próprios (rótulo, papel do arquivo, nome, e, na substituição, o nome e o hash do que saiu).
- **Módulo de versões:** um módulo próprio, ao lado de processos e reuniões, com a mesma forma (interface com uma implementação real e uma falsa nomeada): listar as versões de um processo (com os arquivos e as marcas da conferência), enviar versão, registrar histórica, acrescentar relatório, sem alteração de conteúdo, substituir e baixar. A implementação real fala com a função do servidor e envia os bytes direto ao Drive pela sessão de envio; a leitura da lista vem do banco.

### Conferência dos arquivos (no navegador, antes do envio)

Funções puras, usadas pelo formulário:

- extensão aceita para o papel: `.bpmn`, `.png`, `.bpm`, e `.docx` ou `.pdf` no relatório;
- tamanho até 20 MB;
- `.png` começa com a assinatura do formato PNG;
- `.bpmn` é XML com o elemento `definitions` do namespace do BPMN 2.0 (lido com o `DOMParser` nativo).

A checagem completa do conteúdo do .bpmn é da v1.5. A função do servidor repete as conferências de extensão e tamanho (o navegador não é confiável) e, depois do envio, confere o tamanho real informado pelo Drive.

### Nome padrão dos arquivos

Função pura, usada no formulário (prévia) e na função do servidor (nome gravado no Drive e no banco):

- fluxograma: `{SIGLA}_V{número}[F]_{Nome do processo}.{extensão}`; relatório: `{SIGLA}_V{número}[F]_{Nome do processo}_Relatório.{extensão}`;
- sigla e nome do processo são os do momento do envio; acentos mantidos; os caracteres `\ / : * ? " < > |` e os de controle viram `-`; espaços repetidos viram um só.
- O nome fica guardado no envio (regra 18): renomear o processo ou o setor depois não muda os nomes já gravados. Na substituição, o arquivo novo recebe o nome do que sai.

### Função do servidor (Edge Function `arquivos-no-drive`)

É a primeira Edge Function do projeto (seção "Edge Functions" de `.claude/regras/banco.md`). Referência que já funciona no Drive do CED: a função `drive-upload` e o módulo `evidenciaDrive` do Projeto Diagnóstico de Maturidade ESG.

- **Segredos** (no projeto Supabase de cada ambiente, gravados pelo usuário no terminal dele): e-mail e chave privada da conta de serviço do EP e o identificador do Drive compartilhado (ou pasta raiz) daquele ambiente; também a lista de origens aceitas (endereço do site). Fora do código, do `.env.example` e do git; a configuração é lida num único ponto da função.
- **A chave secreta do Supabase não é usada.** A função fala com o banco com o login de quem chamou (o token que chega no pedido), então a RLS vale para tudo o que ela lê e grava. A única credencial secreta é a da conta de serviço do Google, usada só para falar com o Drive, com o escopo de acesso total do Drive (conta de serviço não passa pela tela de consentimento).
- **Antes de qualquer ação**, confere quem chamou: logado, linha em `usuarios` ativa e com o perfil exigido pela ação. A decisão (quem pode, qual entrada vale) fica num **arquivo puro**, sem dependência do Deno, testado no Vitest.
- **Ações:**
  - `iniciar_envio`: recebe processo, papel, nome original, tamanho e, conforme o caso, versão (relatório, substituição) ou número histórico. Confere perfil, situação do processo (lida da view `processos_com_andamento`), extensão e tamanho; garante a pasta do processo no Drive (criando ou renomeando/movendo a pasta, ver "Pastas"); abre uma sessão de envio resumível no Drive com o nome padrão (ou, na substituição, uma sessão de atualização do mesmo arquivo do Drive) e devolve o endereço da sessão. Os bytes vão do navegador direto ao Google.
  - `registrar`: recebe a operação (versão nova, histórica, relatório, substituição) e os identificadores dos arquivos que chegaram ao Drive; lê de cada um, no Drive, o tamanho real, o formato e o hash MD5; confere tamanho e formato; e grava tudo no banco numa única chamada à função do banco correspondente, com o login de quem chamou. Se algo falhar, nada é gravado e os arquivos que subiram ficam órfãos na pasta (a função não apaga nada).
  - `sem_alteracao`: na versão nova com relatório pendente, copia no Drive o relatório da versão anterior para a pasta do processo com o nome da versão nova e registra o arquivo no banco, marcado como vindo da versão anterior.
  - `baixar`: confere que quem chamou está ativo e que lê o arquivo pela RLS; busca os bytes no Drive e devolve com o nome padrão. A interface monta o arquivo no navegador e o abre (ou baixa, se a aba for bloqueada), como na plataforma ESG.
  - `conferir`: para um processo, compara o hash e a existência de cada arquivo no Drive com o que o banco guarda e devolve, por arquivo, `ok`, `alterado` ou `nao_encontrado`. Chamada ao abrir a seção Versões; o resultado não é gravado.
- **Substituir sem guardar o anterior** (ADR 0007): a substituição grava o conteúdo novo no **mesmo arquivo do Drive** (mesmo identificador); a plataforma não guarda o anterior. O próprio Drive pode manter a revisão anterior por um tempo, fora do controle da plataforma.
- **Resposta e logs** sem dado pessoal; erro com código e mensagem genérica.
- **Drive sem espaço:** o erro de cota do Google no envio vira a recusa "não há espaço no Drive".

### Pastas no Drive

- `<raiz do ambiente> / <SIGLA do setor> / <Nome do processo> / <arquivos>`; o subprocesso tem a sua pasta dentro da pasta do setor dele (não dentro da pasta do pai).
- O identificador da pasta do setor e da pasta do processo no Drive fica guardado no banco, para a pasta ser achada mesmo depois de renomeada.
- **A pasta acompanha na próxima vez que a plataforma mexe nela:** a cada `iniciar_envio`, a função confere se o nome e o lugar da pasta batem com a sigla e o nome atuais e, se não, renomeia ou move a pasta. Os arquivos mantêm o nome com que foram enviados.

### Modelo de dados

**Tipos novos:** `papel_do_arquivo` = `bpmn` | `png` | `bpm` | `relatorio`.

**Tabela `versoes`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `processo_id` | uuid → `processos` | sim | referência recusa apagar o processo |
| `numero` | integer | sim | maior que zero; único por processo; na versão nova, dado pelo banco (maior número do processo + 1, contando as históricas) |
| `historica` | boolean | sim | falso por padrão |
| `etapa_id` | uuid → `etapas` | não | na versão nova, a etapa atual do processo no envio, preenchida pelo banco (view `processos_com_andamento`); nula na histórica |
| `observacao` | text | não | até 2.000 caracteres, sem espaços nas pontas, vazio vira nulo |
| `enviada_por` | uuid → `usuarios` | sim | quem chamou, preenchido pelo banco |
| `enviada_em` | timestamptz | sim | gerado |

**Tabela `arquivos_da_versao`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `versao_id` | uuid → `versoes` | sim | |
| `papel` | `papel_do_arquivo` | sim | único por versão |
| `nome` | text | sim | nome padrão, com extensão, gravado no envio; até 300 caracteres |
| `formato` | text | sim | extensão: `bpmn`, `png`, `bpm`, `docx` ou `pdf`, coerente com o papel |
| `tamanho` | bigint | sim | em bytes, até 20 MB |
| `hash_md5` | text | sim | o MD5 informado pelo Drive no envio (32 caracteres hexadecimais) |
| `drive_id` | text | sim | identificador do arquivo no Drive |
| `copiado_de` | uuid → `arquivos_da_versao` | não | preenchido no "sem alteração de conteúdo": o relatório da versão anterior |
| `enviado_por` | uuid → `usuarios` | sim | preenchido pelo banco; muda na substituição |
| `enviado_em` | timestamptz | sim | gerado; muda na substituição |

**Tabela `pastas_no_drive`:** `id` (uuid), `setor_id` → `setores` ou `processo_id` → `processos` (exatamente um dos dois; único), `drive_id` (text). Escrita só pela função do servidor, com o login de quem chamou (Administrador e Integrante).

**Gravação em várias linhas:** cada operação (versão nova com os arquivos, histórica, relatório, sem alteração, substituição) é uma função do banco chamada pela função do servidor com o login de quem chamou, sem `security definer`, que grava tudo de uma vez. A RLS decide o resto.

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta só o necessário a logado (`versoes`: ler e incluir; `arquivos_da_versao`: ler, incluir e alterar só `tamanho`, `hash_md5`, `enviado_por` e `enviado_em`; `pastas_no_drive`: ler, incluir e alterar `drive_id`). Assim o teste `10_privilegios_padrao` continua passando.

**Dado pessoal:** o nome de quem enviou (já visto por todo perfil ativo). Os arquivos podem conter nomes de servidores e de responsáveis do setor; ficam no Drive, e na plataforma todo perfil ativo pode baixá-los, como já vê os responsáveis do setor.

**Storage:** nenhum bucket. O teste `01_buckets_privados` continua passando.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `versoes` ler | sim | sim | sim | não | não |
| `versoes` criar | sim | sim | não | não | não |
| `versoes` alterar, apagar | não | não | não | não | não |
| `arquivos_da_versao` ler | sim | sim | sim | não | não |
| `arquivos_da_versao` criar | sim | sim | não | não | não |
| `arquivos_da_versao` alterar (substituir: tamanho, hash, autor, data) | sim | sim | não | não | não |
| `arquivos_da_versao` alterar nome, papel, versão, drive_id; apagar | não | não | não | não | não |
| `pastas_no_drive` ler | sim | sim | sim | não | não |
| `pastas_no_drive` criar, alterar drive_id | sim | sim | não | não | não |
| `pastas_no_drive` apagar | não | não | não | não | não |
| `eventos` de versão ler | sim | sim | sim | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

**Função do servidor** (arquivo puro de decisão, testado no Vitest), por ação:

| Ação | Administrador | Integrante do EP | Consulta | Inativo | Sem login |
|---|---|---|---|---|---|
| `iniciar_envio`, `registrar`, `sem_alteracao` | sim | sim | não | não | não |
| `baixar`, `conferir` | sim | sim | sim | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Número da versão nova é o maior do processo + 1, contando as históricas | gatilho antes de incluir em `versoes` | processo com V5F recebe V6; processo sem versão recebe V1; número enviado pela interface é ignorado na versão nova |
| Número único por processo | restrição única (`processo_id`, `numero`) | histórica V5F repetida recusada |
| Versão histórica só enquanto o processo não tem versão nova | gatilho antes de incluir | histórica depois do V6 recusada |
| Versão nova registra a etapa atual do processo; a histórica não tem etapa | gatilho antes de incluir | versão enviada com a etapa "Reunião de modelagem" atual guarda essa etapa; histórica com etapa nula |
| Envio e alterações só com o processo em andamento | gatilho antes de incluir em `versoes` e de incluir e alterar em `arquivos_da_versao` | processo suspenso, cancelado ou concluído recusado |
| Versão nova tem .bpmn e .png; histórica tem .bpm ou o par .bpmn e .png | gatilho de restrição adiado para o fim da gravação (`deferrable initially deferred`) | versão sem .png recusada; histórica só com .bpm aceita; histórica só com .png recusada |
| Um arquivo por papel em cada versão | restrição única (`versao_id`, `papel`) | segundo relatório na mesma versão recusado |
| Formato coerente com o papel; tamanho até 20 MB; nome até 300 caracteres | restrições | relatório `.png` recusado; 20 MB + 1 byte recusado |
| Versão histórica é somente leitura | gatilho antes de incluir e alterar em `arquivos_da_versao` | relatório acrescentado ou arquivo substituído em histórica recusado (o relatório da histórica só entra na criação dela) |
| "Sem alteração de conteúdo" só copia o relatório da versão imediatamente anterior, que precisa ter relatório | gatilho antes de incluir com `copiado_de` | copiar de versão sem relatório recusado; copiar de versão que não é a anterior recusado |
| Substituir só troca o conteúdo (tamanho, hash, autor, data) | privilégio de coluna | alterar `nome` ou `drive_id` recusado |
| Versão e arquivo não se apagam | sem política nem privilégio de apagar | apagar recusado para todo perfil |
| Não excluir processo com versão | referência recusa apagar; a recusa traz a contagem | excluir processo com 2 versões recusado com "2" |
| Toda mudança vira um evento, com autor, ligado ao processo | gatilhos com entidade `versao` e referência no id do processo | enviar, registrar histórica, acrescentar relatório, sem alteração e substituir geram um evento cada; a substituição traz no "antes" o nome e o hash do que saiu |
| Eventos de versão lidos por todo perfil ativo | política de leitura em `eventos` para a entidade `versao` | Consulta lê; inativo e visitante não |

#### Regras de estado

A versão não tem situação guardada. "Relatório pendente" é calculado (versão nova sem arquivo de papel `relatorio`), na tela. "Alterado fora da plataforma" e "não encontrado no Drive" são calculados a cada abertura pela ação `conferir`, sem gravar. A versão não muda o status de nenhuma etapa (ADR 0006).

#### Migração

Nenhuma migração destrutiva: tabelas, tipo, gatilhos, funções e políticas novos, e a política nova em `eventos`. Nenhum dado existente muda.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que a função do servidor e o banco aceitam e recusam, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de versões. Ela guarda versões, arquivos, conferências e histórico, aceita falhas programáveis (no envio de um arquivo, no registro, no download, na conferência) e imita as recusas, ao lado das falsas do acesso, dos cadastros, dos processos e das reuniões.
  - **O que cobre:**
    - a seção Versões para cada perfil (Consulta só com os links de download);
    - enviar versão com .bpmn e .png, com .bpm, com relatório; número e nomes na prévia; botão desabilitado sem arquivo obrigatório;
    - cada conferência de arquivo que falha (extensão, tamanho, PNG, BPMN);
    - progresso e falha no meio do envio (nada registrado, formulário preservado);
    - registrar histórica (só .bpm; várias); botão sumindo depois da versão nova; número repetido recusado;
    - acrescentar relatório (versão escolhida por padrão e outra), "sem alteração de conteúdo" (aparece só quando cabe);
    - substituir com confirmação; histórica sem [Substituir];
    - baixar (aba nova e queda para download) e falha no download;
    - marcas "relatório pendente", "alterado fora da plataforma", "não encontrado no Drive" e o aviso de conferência que falhou;
    - processo suspenso, cancelado ou concluído sem botões de alteração;
    - cada mensagem de recusa; a recusa de excluir processo com versões;
    - eventos de versão no histórico do processo;
    - estados de carregando, vazio e erro com "Tentar de novo".
  - **Arte anterior:** `App.reunioesNoProcesso`, `App.painelDoProcesso`, `App.historico`, `App.recusaComReunioes`.
- **Função do servidor: a regra de quem pode.** O arquivo puro de decisão, testado no Vitest: cada célula da tabela da função (cada perfil, inativo, sem login), processo fora de andamento, extensão e tamanho recusados, e as entradas inválidas (campo faltando, tipo errado). A chamada de ponta a ponta (Drive de verdade) se confere publicando a função no projeto de desenvolvimento, com o Drive de desenvolvimento e um usuário inventado de cada perfil; no remoto sem Docker, `functions serve` não está disponível.
- **Tradução entre o servidor e a tela.** Testes pequenos do módulo de versões real com o cliente e o `fetch` simulados (classes ou funções nomeadas), provando que os códigos de recusa viram as mensagens, que o envio usa o endereço da sessão devolvido pela função e que a versão só é registrada depois que todos os arquivos chegaram. Arte anterior: `reunioesSupabase`, `recusasDeReunioes`.
- **Funções puras** (conferência dos arquivos, nome padrão, rótulo, relatório pendente, número da próxima versão para a prévia, textos do histórico): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras.
  - **Testes gerais:** `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos:** o de exclusão de processo passa a ter um caso com versão.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os processos, setores, usuários, nomes de arquivo e conteúdos dos testes são inventados; os arquivos de teste no Drive de desenvolvimento também.

## Fora do escopo

- E-mails trocados com o setor (.eml): funcionalidade 6 (rodadas de revisão).
- Tipo "outro" de documento.
- Trava da versão enviada ao setor ou aprovada: decidida no planejamento da funcionalidade 6.
- Envio que muda a etapa (atribuir a etapa 5, concluir a etapa 5): ADR 0006; vira demanda se fizer falta.
- PNG gerado a partir do .bpmn e o visualizador: funcionalidade 7.
- Checagem automática do conteúdo do .bpmn: v1.5.
- Converter .bpm em .bpmn: backlog.
- Baixar a versão inteira num .zip.
- Comparação visual entre versões: v2.
- Importação das versões históricas em lote: funcionalidade 10.
- Pendência "versão sem relatório" no painel geral: funcionalidade 9.
- Projeto do Google Cloud institucional, liberado pela TI: depois da v1 (backlog).
- Sincronizar os membros do Drive compartilhado com os usuários da plataforma: o usuário mantém as permissões direto no Drive.
- Limpeza de arquivos órfãos no Drive (envio que falhou no meio): o usuário os vê na pasta; a função não apaga nada.
- Registro de quem baixou cada arquivo (backlog).

## Observações

- **Verso do cartão (2026-10-19, parte 3 da experiencia-do-quadro):** a seção de versões passa para a coluna esquerda do verso do cartão, com a versão mais recente numa linha de destaque (número e data em mono), o que falta na pílula âmbar ("falta relatório") e no espaço tracejado [+ Acrescentar relatório] no lugar do relatório, um botão por arquivo com a barrinha de cor do tipo, as anteriores recolhidas em "Versões anteriores (n)" e "Registrar versão histórica" num "⋯" da seção. O que cada ação faz não muda. O desenho está na spec de `processos-etapas` ("Verso do cartão").
- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` A seção Versões segue o estilo das seções vizinhas do painel (Reuniões, Subprocessos), com cada versão como um bloco e os arquivos em lista.
  - `[visual]` As marcas "relatório pendente", "alterado fora da plataforma" e "não encontrado no Drive" seguem o padrão das pílulas existentes, com cor e texto (nunca só cor).
  - `[visual]` O formulário de envio mostra a prévia do número e dos nomes, e o progresso do envio fica visível sem rolar.
  - `[visual]` Para a Consulta e para o processo fora de andamento, a seção não mostra botões de alteração; os links de download continuam.
  - `[visual]` Mensagens de falha e de recusa em vermelho.
  - `[visual]` O arquivo baixado abre numa aba nova (.png, .pdf) ou é salvo com o nome padrão.
- **Passos do usuário, fora da sessão** (descritos no ticket da função, com o roteiro):
  1. criar a conta de serviço do EP no projeto Google Cloud pessoal (o mesmo do login) e gerar a chave;
  2. criar os Drives compartilhados (ou pastas raiz) "EP – desenvolvimento" e "EP – produção" no Drive do CED e adicionar a conta de serviço como membro com permissão para criar, renomear e mover pastas e arquivos (a conferir no ticket qual papel do Drive basta, provavelmente "Gerente de conteúdo");
  3. gravar os segredos no projeto Supabase de desenvolvimento, no próprio terminal (a chave nunca vem para a conversa);
  4. aprovar a publicação da função no projeto de desenvolvimento;
  5. manter no Drive as permissões da equipe (Integrantes como Colaborador; o usuário como Administrador).
- **Divergências com `.scratch/especificacao.md`**, decididas na sabatina de 2026-10-15:
  - Documento, VersãoDocumento e ArquivoVersao viraram versão do processo com os arquivos dentro (ADR 0005);
  - o envio não atribui nem conclui a etapa 5 (ADR 0006);
  - "versões nunca são apagadas; substituir cria versão nova" virou "a versão nunca se apaga; um arquivo se substitui sem guardar o anterior" (ADR 0007);
  - Storage com cópia ao Drive na v1.5 virou Drive desde já, sem Storage (ADR 0008);
  - "referência ao Drive" deixou de ser opcional: todo arquivo tem o identificador do Drive;
  - o .bpm é opcional (decisão aberta 11.8).
- **Decisões tomadas ao escrever a spec, a confirmar na leitura:**
  - **"Sem alteração de conteúdo" faz uma cópia do relatório no Drive** (pela própria função, sem passar pelo navegador), com o nome da versão nova. Na sabatina, a ideia era não duplicar o arquivo, mas isso valia para o Storage; com a pasta aberta à equipe, sem a cópia o relatório do V7 não apareceria no Drive com o nome do V7, e substituir um dos dois mudaria os dois.
  - **O hash é o MD5 informado pelo Drive**, lido pela função depois do envio, e não um hash calculado no navegador: é o único que o Drive informa de volta, e é com ele que a conferência "alterado fora da plataforma" funciona.
  - **A função grava no banco com o login de quem chamou**, e não com a chave secreta do Supabase, que continua fora do projeto. A única chave secreta é a da conta de serviço do Google.
  - **A pasta acompanha a renomeação na próxima vez que a plataforma mexe nela** (próximo envio), e não no momento em que o processo é renomeado, para não acoplar a tela de processos à função do servidor.
  - **A substituição grava no mesmo arquivo do Drive**, o que não apaga nada (a função não apaga, decisão da sabatina) e não deixa o anterior visível na pasta.
  - **A conferência com o Drive roda a cada abertura da seção Versões**, sem gravar o resultado.
  - **Versão histórica também exige o processo em andamento**, como as demais ações.
  - **Observação da versão até 2.000 caracteres.**
- **Rede do escritório:** a migração vai pelo workflow "Migrar banco de desenvolvimento" e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção. A função também precisa entrar nos roteiros "Publicar no banco de produção" e "Backup e restauração" do `/ship` (o backup do banco não leva os arquivos; eles estão no Drive do CED).
- **Privilégios padrão:** toda tabela nova em `public` reprova o teste `10_privilegios_padrao` até receber o seu `revoke`.
- **Primeira Edge Function do projeto:** no primeiro uso, confirmar na documentação atual do Supabase como a função autentica o usuário e quais variáveis ele injeta (regra de `banco.md`); o pré-commit e o ESLint precisam alcançar o arquivo puro de decisão.

## Como ficou construído (acertos do /ship, 2026-10-16)

O que a implementação faz de diferente do texto acima, ou além dele. O porquê de cada ponto está em `desvios.md`.

- **Número da versão:** o banco dá o número (gatilho `preparar_versao`); a tela manda o número da prévia e o registro recusa com `numero_da_versao_mudou` se o banco der outro, para o nome do arquivo no Drive nunca divergir.
- **Seção Versões:** fica em Detalhes, depois de Reuniões e antes das ações do processo. Só o [Acrescentar relatório] fica na seção; o [Sem alteração de conteúdo] fica em cada versão com relatório pendente.
- **Substituição:** "mesmo tipo" é mesmo papel e mesma extensão. A confirmação vem depois de escolher o arquivo. A substituição atualiza o mesmo arquivo do Drive (mesmo identificador); o nome fica. Substituir o relatório original de uma cópia "sem alteração" não muda a cópia (`copiado_de` e a marca seguem).
- **Download:** só `.png` e `.pdf` abrem em aba nova; os demais formatos baixam direto, com o nome padrão. O servidor devolve sempre `application/octet-stream`.
- **Função do servidor, conferências além das da spec:**
  - o arquivo registrado precisa estar na pasta do processo (`arquivo_fora_da_pasta`), ter o rótulo da versão no nome (`_V<n>_` ou `_V<n>F_`; na substituição o nome fica) e ter ao menos 1 byte;
  - o relatório depois só vale para versão do próprio processo;
  - antes de baixar, substituir, conferir, copiar ou mover pelo `drive_id` guardado, a função confere que o item está debaixo da raiz do ambiente (`_shared/raiz.ts`), porque a conta de serviço enxerga mais que a pasta do ambiente e o `drive_id` é gravado pelo banco por quem escreve;
  - a pasta do processo não é acertada (renomeada ou movida) numa substituição; a próxima versão nova a acerta.
- **Banco:** `drive_id` só com letras, números, `_` e `-` (até 200), nas duas tabelas (migração `20261016200000_drive_id_com_formato`). Versão histórica é somente leitura depois da chamada que a cria. Cada arquivo que entra depois da versão gera um evento (`acrescentar_relatorio`, `sem_alteracao`, `substituir`).
- **Recusas da tela:** arquivo vazio e `entrada_invalida` têm frase própria (antes viravam "erro inesperado").
- **Provas pendentes:** a conferência visual das telas e a prova no Drive dos critérios 3 e 4 do ticket 08 (sigla trocada e mudança de setor) e da saída do Integrante dos tickets 01, 02, 04 e 05. A função corrigida nesta etapa ainda precisa ser publicada no desenvolvimento.

Entregue em 2026-10-16 (commit 869901d), com ressalva: critérios [visual] presumidos (a tela não foi conferida) e função arquivos-no-drive corrigida ainda não publicada no desenvolvimento
Em revisão desde 2026-10-19
