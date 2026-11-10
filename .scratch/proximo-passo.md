# Próximo passo (2026-11-10)

**Feito:**
- `/ship` de revisoes-aprovacao, cobrindo também processos-etapas, documentos-versoes e importacao-dados-atuais (as quatro estavam "Em revisão desde" pela mesma mudança das duas revisões e pela correção do casamento da pasta). Marca nas quatro specs (commit 46aedf9) e marco `marco/2026-11-10-entrega-revisoes-aprovacao`.
- O critério 19 estava descumprido (o Agora não dizia o que se revisa). Foi corrigido no próprio /ship: "A revisar: Relatório V1" e "A revisar: V8" (commit dbcffe2).
- Ajuste da importação da pasta (commit e2d810b): a versão sem .bpm próprio usa o .bpm da versão seguinte do mesmo processo (as versões anteriores ficam nas abas dele), com aviso na prévia. Sem migração. A spec de importacao-dados-atuais voltou a "Em revisão desde 2026-11-10".
- Achados menores das revisões de código e de segurança foram para o backlog. Um deles depende de você: o Substituir conta como "enviado nesta passagem".

**Próximo: `/ship importacao-dados-atuais` (Sonnet), só para o ajuste do .bpm. Depois, publicar na produção, nesta ordem, com a sua aprovação no momento, pelos roteiros de `.claude/regras/producao.md`:**
1. Banco de produção: as migrações `20261110165927_duas_revisoes_etapas` e `20261110171004_duas_revisoes_registro`, pelo workflow "Migrar banco de produção". Antes, confira que o Catálogo da produção não tem etapa chamada "Revisão do relatório" ou "Revisão do fluxograma" criada à mão: a migração seria recusada.
2. Site: o build da `main` (o site no ar é o do commit `0451a0e`).

Modelo: Sonnet (o roteiro de produção roda dentro do `/ship`). A revisão de segurança para produção já foi feita (2026-11-05), então não se repete.

**Depois, por sua conta:**
- A carga real pela tela: primeiro a planilha, depois a pasta.
- Deixar a visibilidade do site como Público na Netlify.
- Com dados na produção, criar `BACKUP_SENHA_PRODUCAO` e fazer o primeiro backup.

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/ship importacao-dados-atuais
```

Depois dele, na mesma sessão:

```
/ship revisoes-aprovacao: rodar o roteiro "Publicar no banco de produção" (as duas migrações das duas revisões) e depois o "Publicar o site", de .claude/regras/producao.md
```
