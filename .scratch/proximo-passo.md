# Próximo passo (2026-11-10)

**Em andamento: o ticket 07 de revisoes-aprovacao (Duas revisões)**, pelo `/executar-complexo`, na branch `revisoes-aprovacao-07` (já enviada ao GitHub). O plano está em `.scratch/revisoes-aprovacao/plano-07.md`, e as caixas abertas são o que falta.

**Pronto na branch:**
- as duas migrações (`20261110165927_duas_revisoes_etapas` e `20261110171004_duas_revisoes_registro`) e os testes de banco 76 e 77, com o 22, o 38, o 39, o 41, o 42 e o 75 ajustados;
- as telas: o formulário de versão e o registro nas duas revisões, o "Sem … para revisar.", a gaveta de cada revisão, o histórico com o nome da revisão e a confirmação do Substituir;
- 3904 testes passando, tipos, lint e circulares limpos.

**Parado aqui:** o banco de desenvolvimento já tem uma etapa chamada "Revisão do relatório" (ou "Revisão do fluxograma"), criada à mão no Catálogo, e por isso a migração é recusada no "Testes de banco". Por decisão sua, você exclui ou renomeia essa etapa no Catálogo do desenvolvimento e confere se a produção tem a mesma (ver `desvios.md` do ticket).

**Depois que a etapa sair, o resto do ticket:**
1. rodar o workflow "Testes de banco" na branch e ler o 76 e o 77;
2. aplicar as duas migrações no desenvolvimento pelo workflow "Migrar banco de desenvolvimento";
3. `npm run db:types`, e comitar;
4. juntar a branch à `main`, enviar e marcar o ticket com `Concluído em`.

Depois vêm o `/polir` (Sonnet), com os três pontos anotados no `desvios.md`, e o `/ship` (Sonnet).

**Ainda pendente, a seu pedido:** publicar o site pelo roteiro "Publicar o site" de `.claude/regras/producao.md`. Com as migrações novas, o banco de produção vai primeiro.

**Para retomar numa sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/executar-complexo .scratch/revisoes-aprovacao/issues/07-duas-revisoes.md
```
