# 03: Planilhas com "Não publicado"

**Como resolve a sua parte.** Hoje as planilhas dos dashboards mostram "Dispensada" na fase VII de quem não vai para publicação, o que parece definitivo. Com a escolha de publicação do ticket 01:

- a fase VII de um processo não publicado sai "Não publicado" e não conta como concluída;
- o rótulo da situação fica "Publicado" com a Publicação concluída e "Concluído" com a escolha "não";
- o processo arquivado continua contado como concluído.

**What to build:**

- **Banco:** o pacote das planilhas passa a incluir `vai_para_publicacao`, por migração nova, com o teste do pacote ajustado.
- **Funções puras das planilhas:** a fase VII vira "Não publicado" quando a escolha é "não", no lugar da exceção "Dispensada". O rótulo da situação segue a regra acima. A contagem da planilha pública conta a fase VII só quando concluída. Os exemplos e o cenário de teste ganham um processo não publicado e um arquivado.
- **Passo seu, fora da sessão:** publicar de novo a função `planilhas-dos-dashboards` no desenvolvimento, com o vínculo conferido, e pedir uma atualização pela aba Planilhas para conferir.

Spec: histórias 38 a 40.

**Blocked by:** 01 (coluna `vai_para_publicacao` e a regra nova do concluído).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: teste antes da migração, provando que o pacote traz a escolha de cada processo e que o arquivado aparece como concluído.
- [ ] A fase VII de um processo com escolha "não" sai "Não publicado", sem data de conclusão, e não conta como concluída na planilha pública.
- [ ] O rótulo da situação é "Publicado" com a Publicação concluída (inclusive depois de Registrar publicação) e "Concluído" com a escolha "não".
- [ ] "Dispensada" não aparece mais como situação de fase.
- [ ] Testes unitários das funções puras (fases, situação do processo, interna e pública) cobrindo os casos acima.
- [ ] Depois da republicação da função, uma atualização pela aba Planilhas mostra "Não publicado" num processo de teste. Esta conferência é sua.
