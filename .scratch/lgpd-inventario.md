# Inventário de dados pessoais (LGPD), 2026-11-05

Feito a partir das migrações (`supabase/migrations/`), das funções (`supabase/functions/`) e do `.scratch/projeto.md`, na revisão de pré-produção. Serve para você levar ao encarregado de dados, ao jurídico e à TI. Não há dado real no repositório: testes e seed usam só dados inventados.

**O que decidir com eles (nada disso está decidido):** por quanto tempo guardar cada coisa; se a plataforma deve registrar também as **leituras** (hoje só grava alterações); como atender um pedido de eliminação, já que o histórico não se altera e usuário que já entrou não se exclui (ADR 0002); a validação da nuvem externa (Supabase, Google Drive/Sheets, Netlify).

## Onde ficam os dados

| Onde | O que guarda | Região |
| --- | --- | --- |
| Banco (Supabase, projeto de produção) | Tabelas abaixo | São Paulo (`sa-east-1`), conforme o resumo do projeto |
| Google Drive compartilhado "EP – produção" | Os arquivos das versões e os anexos, que podem ter dado pessoal (ex.: `.eml` com nomes e conversas) | Definida pelo Google Workspace do CED; não verificada aqui |
| Planilhas do Google (dashboards) | Pacote montado a partir do banco: nome e dados dos processos, setor, macroprocesso e etapas; **não** leva e-mail nem foto | Idem Drive |
| Netlify (site estático) | Só o código da interface; **nenhum dado de pessoas** | CDN global; a exigência de região do projeto precisa ser conferida com o jurídico |
| Login Google (OAuth) | Nome, e-mail e foto da conta institucional, lidos no primeiro acesso | Google |

## Tabelas e colunas com dado pessoal

| Tabela / coluna | Dado | Finalidade | Quem vê |
| --- | --- | --- | --- |
| `usuarios` (`nome`, `foto_url`, `perfil`, `ativo`, `primeiro_acesso_em`) | Nome e foto da conta Google; perfil; datas | Identificar quem fez cada ação e controlar o acesso | Perfis logados (ver RLS por tabela nas specs de `login-perfis`) |
| `usuarios_emails` (`email`) | E-mail institucional (`@ccivil.pr.gov.br`) | Ligar o login ao usuário | Administrador (e o próprio usuário, conforme a política) |
| `autorizacoes` (`email`, `criada_por`) | E-mail autorizado a entrar, antes do primeiro acesso | Cadastro fechado: só entra quem foi autorizado | Administrador |
| `eventos` (`autor_id`, `detalhes` jsonb) | **Histórico que nunca se altera**: quem fez o quê e quando, com cópia do "antes" e do "depois" do registro, o que pode incluir nomes, observações e (nos eventos antigos de responsável do setor, tabela já apagada) nomes e e-mails | Rastreabilidade e prestação de contas | Perfis com permissão de leitura do histórico |
| `processos` (`nome`, `contexto`, `observacoes`, `motivo_da_situacao`) | Texto livre: pode citar nomes de servidores | Cadastro e acompanhamento do processo | Perfis logados por RLS |
| `versoes` (`observacao`, `enviada_por`), `arquivos_da_versao` (`nome`, `enviado_por`) | Texto livre e nome de arquivo; quem enviou | Controle de versões dos documentos | Perfis logados por RLS |
| `anexos` (`nome`, `enviado_por`) | Nome do arquivo e quem enviou; o arquivo (ex.: `.eml`) fica no Drive | Documentos avulsos do processo | Administrador e Integrante (escrita); leitura por RLS |
| `setores` (`observacoes`), `setores_envolvidos` (`observacao`) | Texto livre | Cadastro de setores | Perfis logados por RLS |
| `andamentos` (`responsavel_id`), `passagens` (`movido_por`), `revisoes_internas` (`revisor_id`), `aprovacoes` (`registrada_por`, `link`), `reunioes_usuarios` (`usuario_id`) | Ligações entre pessoas e ações (responsável, revisor, quem moveu, participante) | Quem é responsável por quê | Perfis logados por RLS |
| `atualizacoes_das_planilhas` (`pedida_por`, `motivo`) | Quem pediu a atualização das planilhas | Registro das atualizações | Administrador |

Tabelas **sem** dado pessoal direto: `etapas`, `macroprocessos`, `pastas_no_drive`, `pdfs_da_aprovacao` (arquivo no Drive), `reunioes`, `reunioes_processos` (a data e o vínculo; os participantes ficam em `reunioes_usuarios`).

## Histórico imutável e eliminação

- `eventos` guarda cópia do estado dos registros. Apagar ou anonimizar uma pessoa exigiria mexer no histórico, que a plataforma foi desenhada para não alterar.
- Usuário que já entrou não se exclui (ADR 0002); a saída é **desativar**.
- Anexo retirado vai para a lixeira do Drive e some em 30 dias; a linha sai do banco, mas o histórico guarda o nome do arquivo e quem retirou.

## Pendências de decisão

1. Prazo de guarda de cada categoria acima.
2. Registro de leituras (hoje só alterações).
3. Procedimento para pedido de eliminação de dado.
4. Validação jurídica e da TI da nuvem externa (Supabase, Google, Netlify) e da região de cada uma.
5. Texto de aviso de privacidade na tela de login, se o jurídico pedir.
