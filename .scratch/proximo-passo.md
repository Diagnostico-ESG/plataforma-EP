# Próximo passo (2026-11-10)

**Onde parou:** `/ship` de `importacao-dados-atuais`, interrompido no meio (a sessão caiu). Feito: passos 0 (entregas anteriores em ordem), 1 (build limpo; `dist/` sem vitrine), 2 (revisão de código de dois eixos), 3 (auditoria de pacotes: produção sem vulnerabilidade; só desenvolvimento, 2 altas e 9 moderadas, igual à linha de base), 5 (cobertura 98,1% de instruções) e 6 (sem dependência circular).

**Mudanças não comitadas** (correção dos achados da revisão, pelo caminho de bug): o `.pdf` do relatório que falhou volta na rodada seguinte (história 53); os avisos aparecem também na prévia (história 44); a sigla como campo próprio; `mensagemDoErro` reaproveitada. A bateria passa (3872), mas o **typecheck falha**: `VersaoDaPasta` (`src/importacao/lerPasta.ts`) não declara `sigla`, que `previaDaPasta.ts:55` usa. Falta também trocar a cópia do envio ao Drive em `versoesSupabase.ts` e `anexosSupabase.ts` por `enviarAoDrive`, como decidido na revisão.

**Falta no `/ship`, nesta ordem:**
1. Corrigir o tipo, trocar as duas cópias por `enviarAoDrive`, rodar `npm test` e o typecheck e comitar a correção.
2. Refazer os passos 1, 2 e 5 sobre o diff novo (o `/ship` manda refazê-los depois de corrigir critério).
3. Passo 4 (revisão de segurança do código: subagente pela `.claude/regras/revisao-seguranca.md`), passo 7 (conferências de banco), passos 8 e 9 (`desvios.md` com os achados da revisão e o backlog dos que ficaram de fora; spec), passo 10 (`.scratch/security.md` com a auditoria de 2026-11-09) e passo 12 (marca de entrega e marco). O `[visual]` foi visto só por medida na vitrine local, então a marca sai com ressalva, a menos que você olhe a tela.
4. Depois: `/planejar checklist-do-cartao` (Opus, modo completo).

**Em outra frente (continua valendo):** antes da carga real, o backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e a publicação na produção das migrações `20261106230000_importado_concluido_no_quadro` e `20261110000447_importar_versao` e da função `arquivos-no-drive`, pelo roteiro de produção, a seu pedido. Teste de banco 22 reprovado na `main` (backlog). Apagar a branch remota `importacao-dados-atuais` (comando seu).

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/ship importacao-dados-atuais
```
