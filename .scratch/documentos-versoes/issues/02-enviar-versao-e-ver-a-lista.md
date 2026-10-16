# 02: Enviar versão e ver a lista

**Como resolve a sua parte.** Com a ligação ao Drive provada, este ticket entrega o caminho principal: no painel do processo, a seção Versões mostra as versões do processo, e Administrador e Integrante enviam uma versão nova com o .bpmn e o .png (o .bpm e o relatório opcionais). A plataforma dá o número (V1, V2…), mostra antes o nome de cada arquivo, confere os arquivos no navegador, envia-os direto ao Drive e só registra a versão quando todos chegaram. O banco impõe as regras (numeração, etapa atual, processo em andamento, par obrigatório, nada se apaga, processo com versão não se exclui) e o histórico do processo ganha o evento. Enviar não mexe em nenhuma etapa (ADR 0006).

**What to build:** banco (tipo `papel_do_arquivo`, tabelas `versoes` e `arquivos_da_versao`, RLS, privilégios, a função do banco que grava a versão nova com os arquivos, gatilhos das regras e dos eventos, política de leitura dos eventos de versão, recusa de excluir processo com versão); ação `registrar` da função do servidor para versão nova (lê no Drive tamanho, formato e MD5 e grava com o login de quem chamou); módulo de versões (interface, implementação real e falsa nomeada); seção Versões no painel do processo e formulário de envio. Spec: histórias 1 a 13, 41, 42, 45 (versão enviada), 46 a 49; seções "Interface", "Conferência dos arquivos", "Função do servidor" e "Modelo de dados".

**Blocked by:** 01.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes pgTAP antes da migração, um por célula de "quem pode o quê" para `versoes`, `arquivos_da_versao` e os eventos de versão (Administrador, Integrante, Consulta, inativo, visitante), inclusive "ninguém apaga".
- [x] Banco: testes das regras: número dado pelo banco (V1 no processo sem versão; o enviado pela interface é ignorado); etapa atual gravada; processo suspenso, cancelado ou concluído recusado; versão sem .bpmn ou sem .png recusada (restrição adiada até o fim da gravação); segundo arquivo do mesmo papel recusado; formato incoerente com o papel e 20 MB + 1 byte recusados; excluir processo com 2 versões recusado com "2"; enviar gera um evento com autor ligado ao processo.
- [x] `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao` passando; o teste antigo de exclusão de processo ganha o caso com versão; migração aplicada pelo workflow e registrada em `supabase/AMBIENTES.md`.
- [x] A ação `registrar` só grava depois de todos os arquivos estarem no Drive; tamanho e formato reais conferidos no Drive; se algo falhar, nada é gravado e os arquivos que subiram ficam na pasta (a função não apaga). Coberta pelo arquivo puro de decisão.
- [x] Seção Versões no painel do processo e do subprocesso, entre o caminho de etapas e o histórico: versões da mais recente para a mais antiga, cada uma com rótulo, data e hora, autor, etapa, observação e os arquivos com o nome padrão.
- [x] [Enviar versão] (Administrador e Integrante, processo em andamento) abre o formulário: campos de arquivo nativos para .bpmn, .png, .bpm (opcional) e relatório .docx ou .pdf (opcional), observação opcional (até 2.000 caracteres); prévia do número e dos nomes; enviar desabilitado enquanto falta .bpmn ou .png.
- [x] Conferências no navegador, com mensagem ao lado do campo: extensão, tamanho até 20 MB, assinatura do PNG, XML de BPMN 2.0 (`DOMParser` nativo). Funções puras com testes unitários.
- [x] Progresso "Enviando 2 de 3…" com os campos travados; falha num arquivo ou no registro mostra mensagem em vermelho, nada é registrado e o formulário continua preenchido.
- [x] Cada recusa (da função ou do banco) vira mensagem na tela, no padrão de `recusasDeReunioes`, com testes do módulo real (cliente e `fetch` simulados por classes ou funções nomeadas).
- [x] Estados: "Carregando…"; "Nenhuma versão enviada."; erro com [Tentar de novo].
- [x] Consulta e processo fora de andamento: seção sem botões de alteração.
- [x] O histórico do processo mostra o evento de versão enviada, com texto próprio.
- [x] Testes de interface com o aplicativo inteiro e a falsa do módulo de versões cobrindo os itens acima.

## Registro da execução (2026-10-15)

- **Banco (critérios 1 a 3):** `supabase/tests/27_versoes.test.sql` (52 casos) falhou antes da migração, com tabela inexistente (#75), e passou depois, com os 28 arquivos verdes, inclusive `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao` (#77). Migração `20261015224928_versoes` aplicada pelo workflow "Migrar banco de desenvolvimento" (#17) e registrada em `supabase/AMBIENTES.md`. O caso "processo com 2 versões não se exclui" ficou no 27, e não num teste antigo (ver `desvios.md`).
- **Função (critério 4):** a decisão de `registrar` fica no arquivo puro `supabase/functions/_shared/registro.ts`, testado no Vitest: quem pode, entrada, arquivo que não chegou, tamanho real, formato, pasta do processo, MD5 e recusa do banco. A chamada `registrar.ts` lê cada arquivo no Drive e só então grava; não apaga nada. **Ressalva:** a função ainda não foi publicada. A prova real (`scripts/prova-do-drive.mjs`, que agora envia .bpmn e .png e registra a versão) depende dos passos do usuário em `docs/drive-conta-de-servico.md`, junto com a do ticket 01.
- **Tela (critérios 5 a 13):** `src/App.versoesNoProcesso.test.tsx`, `src/App.enviarVersao.test.tsx` e `src/App.versoesNoHistorico.test.tsx`, com o aplicativo inteiro e a `VersoesFalso`. Módulo real coberto por `src/versoes/versoesSupabase.test.ts`, com o cliente e o envio ao Drive simulados por classes nomeadas. **Ressalva `[visual]`:** a tela não foi conferida no navegador; os critérios visuais da spec ficam presumidos até o `/polir` ou o `/ship`.

## Fecho (2026-10-16)

- **Prova real:** o envio do `.bpmn` (sessão resumível, bytes direto ao Drive) e o registro da versão passaram no script do Integrante (relatado OK, saída não colada) e no passo do Consulta (`prova-do-drive.md`).
- **Ressalva `[visual]`:** a tela não foi conferida no navegador; os critérios visuais seguem presumidos até o `/polir` ou o `/ship`.

Concluído em 2026-10-16 (commit d820b0e)
