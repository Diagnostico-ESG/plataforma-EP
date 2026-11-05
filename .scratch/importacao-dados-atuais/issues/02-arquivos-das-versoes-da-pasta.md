# 02: Arquivos das versões da pasta

**What to build:** na seção "2. Arquivos das versões" da tela de Importação, o Administrador escolhe a pasta DOCUMENTOS MAPEAMENTO, vê a prévia das versões e relatórios por processo (cruzados com V1 a V8 da planilha), confirma e os arquivos vão do computador direto ao Drive, ligados às versões. Regras na spec (histórias 41 a 59). Habilita só depois que há processo importado.

**Blocked by:** 01 (Cadastros e etapas pela planilha)

**Status:** ready-for-agent

- [ ] **Primeiro passo (precisa do usuário):** registrar em `amostra/` o desenho da pasta (subpastas e padrão de nome dos arquivos), sem nomes reais; o resto do ticket segue esse registro.
- [ ] Teste pgTAP antes da migração: gravação de versão pela importação, só Administrador (recusa os demais perfis, desativado e visitante); ignora as travas de etapa (ADR 0028 e 0025); mantém número único por processo e .bpm obrigatório; marca a versão com a etapa do processo no momento; pula versão existente sem substituir arquivo; histórico com quem importou. Os testes de versões continuam passando.
- [ ] Migração não destrutiva aplicada no desenvolvimento; tipos atualizados.
- [ ] Módulo de leitura da pasta separado de tela e de Drive: V1 a V8 com rótulo completo ("V5F", "V6P", "V7"), aviso de versão 9 ou maior, versão sem .bpm listada e fora, .png e relatório ausentes sem aviso, arquivo sem versão, de processo inexistente ou fora do padrão listado, relatório com número ligado à versão do nome e .pdf antigo sem número.
- [ ] Prévia por processo (versões que entram, relatórios, o que falta ou sobra) e nada enviado antes de confirmar.
- [ ] Envio arquivo a arquivo pela função `arquivos-no-drive`, com andamento (quantos foram, quantos faltam); falha de um arquivo é listada e os outros seguem; repetir completa só o que faltou; nenhum arquivo passa pelo GitHub nem sai do Drive do CED.
- [ ] Resumo final (criadas, puladas, não entradas, avisos); versão importada abre e baixa como qualquer outra, com o nome padrão.
- [ ] Testes pela tela com `VersoesFalso`, `importacao` falsa e pasta inventada: cada regra acima, segunda rodada, perfil sem acesso.
- [ ] `[visual]` Seção, prévia e andamento seguem o padrão da tela, sem texto redundante.
- [ ] Passo do usuário anotado: publicar de novo `arquivos-no-drive` se a função mudar; a carga real é dele, depois do backup.
