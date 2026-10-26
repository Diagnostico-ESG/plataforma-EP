# 10: Relatório com numeração própria

**Como resolve a sua parte.** Hoje o relatório tem o número da versão, e cada versão nova deixa um "relatório pendente" ou pede "sem alteração de conteúdo". Este ticket dá ao relatório a sua numeração por processo (Relatório V1, V2…, ADR 0026). O relatório se envia sozinho ou junto com a versão, na técnica e na Revisão interna, ligado à versão mais recente. A versão sem relatório próprio mostra o último ("Relatório V2 (da V7)"), e somem a pendência e a cópia.

**What to build:** o relatório numerado de ponta a ponta (banco com a migração, função do servidor, módulo de versões, verso e testes).

- **Banco:**
  - `arquivos_da_versao.numero_do_relatorio`, dado pelo banco (maior do processo + 1) no relatório de versão piloto ou em sequência; único por processo; não alterável;
  - unicidade (versão, papel) para todo papel menos o relatório numerado;
  - relatório novo só .docx, ligado à versão mais recente que não é histórica, só até a Revisão interna;
  - a trava da versão aprovada (ADR 0011) cobre os relatórios ligados a ela;
  - migração: apaga as linhas "sem alteração" e a coluna `copiado_de`; numera os .docx das versões que não são históricas na ordem do envio; deixa sem número os .pdf e o relatório da histórica;
  - evento "Enviou o Relatório V3 (acompanha a V8)"; os eventos antigos mantêm o texto.
- **Função do servidor:** operação de relatório sem versão escolhida, conferindo o número do relatório e a versão da prévia; sai `sem_alteracao`; relatório só .docx; nome `CEE_V8_Nome do processo_Relatório V3.docx`. Termina com o roteiro para o usuário publicar a função no desenvolvimento.
- **Módulo de versões:** sai `semAlteracaoDeConteudo`; `acrescentarRelatorio` vira `enviarRelatorio`; a falsa acompanha.
- **Verso:**
  - [Enviar relatório] na técnica e na Revisão interna, com a prévia "Relatório V3, acompanha a V8";
  - o campo do relatório no envio da versão em sequência, só .docx;
  - a linha do relatório que vale em cada versão; "Relatório da V5F" na histórica; .pdf antigos como estão;
  - saem a pílula "falta relatório", [+ Acrescentar relatório] e [Sem alteração de conteúdo];
  - [Substituir] nos relatórios numerados, menos nos ligados à versão aprovada.

Spec: `.scratch/documentos-versoes/spec.md`, seção "Arquivos por etapa (mudança de 2026-10-26)" (histórias 84 a 92, 95, 96, 109 e 111; decisões 5 a 7).

**Branch:** `quadro-livre-parte-3`. A migração vai ao banco de desenvolvimento pelo workflow "Migrar banco de desenvolvimento".

**Blocked by:** 09 (Versões por etapa): o relatório pode acompanhar a versão piloto, e o envio por etapa vem de lá.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP escritos antes da migração e vistos falhar: número do relatório por processo, ligação à versão mais recente, dois relatórios na mesma versão, .pdf recusado, relatório sem versão piloto nem em sequência recusado, relatório depois da Revisão interna recusado, substituição recusada nos ligados à versão aprovada, a migração (cópias apagadas, números na ordem, .pdf e histórica sem número), o evento. O teste `29` reescrito e o `30` ajustado.
- [ ] Testes de interface com o aplicativo inteiro: relatório sozinho com a prévia, junto com a versão, .pdf recusado, o relatório que vale com "(da V7)", nenhuma marca de pendência, "Relatório da V5F", substituir relatório numerado e sem [Substituir] na aprovada, Consulta sem botões, eventos novos e antigos no histórico. `App.relatorioDepois` e os testes que usam "sem alteração" passam ao modelo novo.
- [ ] O arquivo puro de decisão da função e o nome padrão têm testes do relatório numerado; os testes do módulo real provam a chamada e as frases.
- [ ] A função pura do relatório que vale tem testes unitários.
- [ ] `[visual]` A linha do relatório no destaque mostra "Relatório V2" ou "Relatório V2 (da V7)" sem quebrar a linha dos arquivos.
