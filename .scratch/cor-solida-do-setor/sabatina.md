# Sabatina — cor-solida-do-setor (2026-10-28)

Decisões confirmadas pelo usuário ("Ok para tudo"). Registro da decisão: `docs/adr/0033-cor-do-setor-lisa-no-tom-claro.md`. `CONTEXT.md` não muda (a definição de Cor do setor já diz "cor clara").

1. **Tom escuro some:** sai o cálculo do tom escuro de `src/cadastros/corDoSetor.ts` (`FATOR_DO_TOM_ESCURO`, `escurecer`, campo `escuro`, variável `--cor-escuro` em `estiloDaCor`). O teste de contraste passa a conferir só o tom claro (4,5:1, as 30 cores).
2. **Liso em todo lugar:** `linear-gradient(... --cor-claro, --cor-escuro)` vira `var(--cor-claro)` em `SeloDoSetor.css`, `Quadro.css` (cabeçalho da coluna por setor), `styles/caixas.css` (quadradinho) e `GradeDeCores.css` (as duas regras da amostra; a da escolhida mantém o ponto). Testes que citam `--cor-escuro` ou "degradê" (`SeloDoSetor.test.tsx`, `OpcaoDaCaixa.test.tsx`, `corDoSetor.test.ts`) se ajustam. Comentários que falam em degradê do setor se atualizam.
3. **Barra de etapas azul continua em degradê** (como na prévia).
4. **Fundo tingido da coluna por setor fica como está** (ADR 0032: tom claro a 30%, até o último cartão). Só o cabeçalho fica liso.
5. **Registros:** ADR 0033 novo (os ADRs 0030 e 0031 não se editam, regra do `CLAUDE.md`). No `/to-spec`: acréscimo datado nas specs de `processos-etapas` e `cadastros-basicos` (com `Em revisão desde 2026-10-28`) e em `.scratch/identidade-visual.md`.

Escolha padrão: o motivo da preferência pelo liso não foi dado; o ADR registra só "o usuário preferiu a prévia lisa".
