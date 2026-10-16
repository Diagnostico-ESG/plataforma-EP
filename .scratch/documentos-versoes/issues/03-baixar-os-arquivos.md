# 03: Baixar os arquivos

**Como resolve a sua parte.** As versões aparecem na lista, mas os arquivos estão no Drive, e nem todo usuário é membro dele. Este ticket faz o nome de cada arquivo virar um link: a função do servidor confere que quem pediu está ativo e lê aquele arquivo pela RLS, busca os bytes no Drive e devolve com o nome padrão; a plataforma abre o arquivo numa aba nova ou o baixa. Assim a Consulta também baixa, sem acesso ao Drive.

**What to build:** a ação `baixar` da função passa a receber o arquivo da versão (e não o identificador do Drive) e confere a leitura pela RLS de `arquivos_da_versao`; download no módulo de versões (real e falso); links na seção Versões. Spec: histórias 33 a 35 e 44; seção "Função do servidor", ação `baixar`.

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [x] `baixar` recebe o id do arquivo da versão; recusa inativo e sem login; recusa quem não lê o arquivo pela RLS; devolve os bytes com o nome padrão. Coberta pelo arquivo puro de decisão.
- [x] O nome de cada arquivo na seção Versões é um link para todo perfil ativo, inclusive a Consulta.
- [x] A aba é aberta dentro do clique (para o navegador não tratá-la como janela indesejada); o arquivo abre nela (.png, .pdf) ou, se a aba for bloqueada, é baixado com o nome padrão.
- [x] Falha no download (sem conexão, arquivo apagado no Drive) fecha a aba aberta e mostra mensagem em vermelho.
- [x] Testes do módulo real com `fetch` simulado (bytes lidos como arquivo, não como texto) e testes de interface com a falsa: link para cada perfil, sucesso e falha.
- [x] Prova no projeto de desenvolvimento: a Consulta inventada baixa um arquivo enviado pelo Integrante inventado.

## Registro da execução (2026-10-15)

- **Critério 1 (função):** `validarBaixar` passou a exigir `arquivo_id` (uuid) e a ação lê `arquivos_da_versao` com o login de quem chamou; inativo e sem login já eram recusados pelo `conferirChamador`. Coberto no Vitest (`decisao.test.ts`: perfis, inativo, sem login e entradas inválidas). A ação em si (Deno) só se prova de ponta a ponta.
- **Critérios 2 a 4 (tela):** `src/App.baixarArquivo.test.tsx`, com o aplicativo inteiro e a `VersoesFalso`: link para Administrador, Integrante e Consulta, também com o processo suspenso, cancelado ou concluído; .png e .pdf abrem a aba, .bpmn baixa com o nome padrão, aba bloqueada cai no download, falha fecha a aba e mostra o aviso em vermelho. A entrega fica em `src/versoes/abrirOuBaixar.ts` (testada à parte).
- **Critério 5 (módulo real):** `src/versoes/versoesSupabase.test.ts`: os bytes voltam intactos como `Blob` com o tipo do formato, recusa vira frase, sem resposta vira "sem conexão" e resposta em texto vira erro.
- **Critério 6 (prova no desenvolvimento): pendente.** Depende de publicar a função e do roteiro do usuário (`docs/drive-conta-de-servico.md`). O `scripts/prova-do-drive.mjs` já faz o passo: a Consulta inventada baixa o arquivo enviado pelo Integrante inventado e confere os bytes.

## Fecho (2026-10-16)

- **Critério 6 (prova):** a Consulta inventada baixou o arquivo enviado pelo Integrante, com bytes iguais aos enviados (`prova-do-drive.md`).
- **Ressalva `[visual]`:** o link, a aba nova e o aviso de falha não foram conferidos olhando a tela.

Concluído em 2026-10-16 (commit 91ce626)
