# 02: Arquivos das versões da pasta

**What to build:** na seção "2. Arquivos das versões" da tela de Importação, o Administrador escolhe a pasta DOCUMENTOS MAPEAMENTO, vê a prévia das versões e relatórios por processo, tirados do nome dos arquivos, confirma e os arquivos vão do computador direto ao Drive, ligados às versões. A pasta manda; as colunas V1 a V8 da planilha só aparecem na comparação do relatório final. Regras na spec (histórias 41 a 59, com 43a e 48a a 48c) e desenho da pasta em `amostra/pasta.md`. Habilita só depois que há processo importado.

**Blocked by:** 01 (Cadastros e etapas pela planilha)

**Status:** ready-for-agent

- [x] **Primeiro passo (precisa do usuário):** registrar em `amostra/` o desenho da pasta (subpastas e padrão de nome dos arquivos), sem nomes reais; o resto do ticket segue esse registro. Feito em 2026-11-06 (`amostra/pasta.md`).
- [x] Teste pgTAP antes da migração: gravação de versão pela importação, só Administrador (recusa os demais perfis, desativado e visitante); ignora as travas de etapa (ADR 0028 e 0025); mantém número único por processo e .bpm obrigatório; marca a versão com a etapa do processo no momento; pula versão existente sem substituir arquivo; histórico com quem importou. Os testes de versões continuam passando.
- [x] Migração não destrutiva aplicada no desenvolvimento; tipos atualizados.
- [x] Módulo de leitura da pasta separado de tela e de Drive: versão pelo nome `SIGLA_V<n><letra>_<Nome>[_Relatório].<ext>` (F histórica, P piloto, sem letra em sequência; número único por processo, várias F possíveis); letra diferente da do .bpm na mesma versão junta à versão do .bpm, com aviso; versão sem .bpm listada e fora; .png e relatório ausentes sem aviso; arquivo de processo inexistente ou fora do padrão listado; .docx vira o relatório da versão (histórica sem número próprio) e o .pdf de relatório vai para Outros anexos; dois .docx na mesma versão ficam de fora, listados; subpasta dentro do setor lida, com uma linha nas Anotações do processo (sem repetir na segunda rodada).
- [x] Prévia por processo (versões que entram, relatórios, o que falta ou sobra) e nada enviado antes de confirmar.
- [x] Envio arquivo a arquivo pela função `arquivos-no-drive`, com andamento (quantos foram, quantos faltam); falha de um arquivo é listada e os outros seguem; repetir completa só o que faltou; nenhum arquivo passa pelo GitHub nem sai do Drive do CED.
- [x] Resumo final (criadas, puladas, não entradas, avisos) com o relatório das lacunas: buracos na numeração, versões sem .bpm, relatórios duplicados, letras corrigidas, arquivos sem processo e a diferença entre a pasta e as colunas V1 a V8 do .csv da planilha; versão importada abre e baixa como qualquer outra, com o nome padrão.
- [x] Testes pela tela com `VersoesFalso`, `importacao` falsa e pasta inventada: cada regra acima, segunda rodada, perfil sem acesso.
- [x] `[visual]` Seção, prévia e andamento seguem o padrão da tela, sem texto redundante.
- [x] Passo do usuário anotado: publicar de novo `arquivos-no-drive` se a função mudar; a carga real é dele, depois do backup.

Concluído em 2026-11-09 (commit 8e270ef)
