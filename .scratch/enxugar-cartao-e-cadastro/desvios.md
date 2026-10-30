# Desvios — enxugar-cartao-e-cadastro

## 2026-10-29 — `/polir` (audit + polish)

Escopo: os 28 arquivos `.tsx`/`.css` alterados desde o marco `marco/2026-10-29-inicio-enxugar-cartao-e-cadastro`.

**Audit (leitura de código + detector do Impeccable):** detector com 0 problemas. Sem achados P0 nem P1. Foco de teclado global (`index.css`), nome acessível do botão do responsável, ícones de arquivo decorativos e contraste de "Escolher responsável" (`--texto-2` sobre branco, cerca de 5,9:1) conferidos.

**Corrigido**
- [P3] Estado desabilitado: o nome do responsável e "Escolher responsável" mantinham o cursor de clique enquanto a gravação está em andamento. `Agora.css` ganhou `cursor: default` no `:disabled`.

**Deixado de fora**
- Aviso do detector (`Quadro.css:262`, `border-radius: 1px`): falso positivo; é `calc(var(--canto) - 1px)` da faixa do cartão, anterior a esta funcionalidade.
- O nome do responsável só mostra o sublinhado ao passar o mouse (decisão da spec: "parece texto"). Quem usa só teclado vê o contorno de foco; não mudei.
- Critérios `[visual]` não vistos na tela: exigem o login institucional; o servidor de desenvolvimento não foi aberto. Seguem por conferir com o login real.

## 2026-10-30 — `/ship`

- **Divergência da spec:** nenhuma de comportamento. Dois acréscimos pequenos fora do pedido, aceitos: o campo de data (`CampoDeDataDoProcesso`) fica desabilitado enquanto grava, o que vale também para a data da validação; e `Avatar` ganhou a opção `decorativo`.
- **Revisão de código (`/mattpocock-skills:code-review`):** Spec sem requisito faltando. Padrões sem violação firme (o `ProcessosFalso.ts` tem 302 linhas brutas, mas passa no ESLint do projeto). Achados menores levados ao `.scratch/backlog.md`: dois "hoje" (`hojeLocal` x `hojeEmBrasilia`) e o arquivo `textoDaModelagemPiloto.ts` que só guarda `hojeLocal`; nome genérico `POR_FORMATO`; folha do ícone repetida 6 vezes; o pgTAP 72 não exercita em linhas reais a junção dos textos nem o apagar das datas futuras.
- **Revisão de segurança:** o `/security-review` só viu o commit de documentação; fiz a revisão de reserva (menos completa) das 3 migrações, do envio do cadastro, das recusas do banco e do pacote das planilhas. Sem achado.
- **`security-auditor`:** pulado (`package.json` não mudou e `.scratch/security.md` existe). Dependência circular: nenhuma. Tipos do banco: em dia.
- **Migração destrutiva** (`origem_contexto_e_observacoes_saem`: apaga `origem`, `contexto`, `observacoes` e o tipo `origem_do_processo`): confirmada pelo usuário em 2026-10-30; só dados inventados do desenvolvimento.
- **Em aberto, com ressalva na marca:** critérios `[visual]` 14 a 17 não vistos na tela (exige o login real); conferência do cadastro aberto no painel do Supabase de desenvolvimento adiada pelo usuário (backlog); a Edge Function `planilhas-dos-dashboards` precisa ser publicada de novo no desenvolvimento.
