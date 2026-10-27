# Plano do ticket 02: Confirmação de arquivos, enviar agora (travas-em-avisos)

Execução do [ticket 02](issues/02-confirmacao-de-arquivos-enviar-agora.md) sobre o 01; requisitos na seção "Travas em avisos" da spec de `documentos-versoes` (histórias 139, 140, 148, 149) e no ADR 0028. Sem banco: nenhuma migração nem tipo novo (as regras de `banco.md` não se aplicam; o envio usa as funções de versões de hoje).

- [x] 1. Recuperar `moverDepoisDoEnvio` (com teste) e a janela de envio da trava do histórico; `FRASE_DOS_ARQUIVOS_ENVIADOS` e `nomeNaPergunta` em `frasesDaConfirmacaoDeArquivos.ts`.
- [x] 2. `JanelaDeEnvioDeArquivos` (título "Enviar os arquivos da {etapa}", botão [Enviar e continuar], formulário da primeira etapa que falta).
- [x] 3. Hook `useMovimentoDoProcesso`: `envio`, `enviarAgora`, `arquivosEnviados` (pergunta volta com o que sobrou, ou chegada, ou movimento), `fecharEnvio`.
- [x] 4. `JanelaDaConfirmacaoDeArquivos` ganha [Enviar arquivos agora] (principal); `JanelasDoMovimento` monta o envio.
- [x] 5. Testes `App.enviarArquivosAgora` (lista do Agora e arrastar) e apoio `src/testes/versoComArquivos.tsx`; `npm test`, lint e tipos.
