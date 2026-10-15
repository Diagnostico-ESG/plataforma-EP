# 03: Baixar os arquivos

**Como resolve a sua parte.** As versões aparecem na lista, mas os arquivos estão no Drive, e nem todo usuário é membro dele. Este ticket faz o nome de cada arquivo virar um link: a função do servidor confere que quem pediu está ativo e lê aquele arquivo pela RLS, busca os bytes no Drive e devolve com o nome padrão; a plataforma abre o arquivo numa aba nova ou o baixa. Assim a Consulta também baixa, sem acesso ao Drive.

**What to build:** a ação `baixar` da função passa a receber o arquivo da versão (e não o identificador do Drive) e confere a leitura pela RLS de `arquivos_da_versao`; download no módulo de versões (real e falso); links na seção Versões. Spec: histórias 33 a 35 e 44; seção "Função do servidor", ação `baixar`.

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] `baixar` recebe o id do arquivo da versão; recusa inativo e sem login; recusa quem não lê o arquivo pela RLS; devolve os bytes com o nome padrão. Coberta pelo arquivo puro de decisão.
- [ ] O nome de cada arquivo na seção Versões é um link para todo perfil ativo, inclusive a Consulta.
- [ ] A aba é aberta dentro do clique (para o navegador não tratá-la como janela indesejada); o arquivo abre nela (.png, .pdf) ou, se a aba for bloqueada, é baixado com o nome padrão.
- [ ] Falha no download (sem conexão, arquivo apagado no Drive) fecha a aba aberta e mostra mensagem em vermelho.
- [ ] Testes do módulo real com `fetch` simulado (bytes lidos como arquivo, não como texto) e testes de interface com a falsa: link para cada perfil, sucesso e falha.
- [ ] Prova no projeto de desenvolvimento: a Consulta inventada baixa um arquivo enviado pelo Integrante inventado.
