# 0047 — O relatório é numerado com R, e os arquivos antigos são renomeados

Data: 2026-11-13. Estado: aceito. Muda o ADR 0026 só na letra do número do relatório.

**Contexto.** O ADR 0026 deu ao relatório numeração própria por processo, com a mesma letra da versão: "Relatório V2 (da V7)". Com dois V de sentidos diferentes no mesmo rótulo, o número do relatório se confunde com o da versão. A produção já tem relatórios numerados no Drive (inclusive os da carga real), com `_Relatório V2` no nome.

**Decisão.** O número do relatório passa a usar a letra R: "Relatório R2 (da V7)", e o nome no Drive termina em `_Relatório R2.docx`. A versão continua com V (V7, V3P, V5F), e os relatórios sem número (.pdf antigos e o da versão histórica) continuam sem número. Só a letra muda: não há relatório piloto. Todas as telas mostram R, inclusive para os relatórios antigos, porque o texto vem do número guardado.

Os relatórios numerados que já existem são renomeados para R, no Drive e no nome guardado, por um botão "Renomear relatórios para R" na aba Importação, só para o administrador, disparado uma vez em cada ambiente. Cada arquivo se renomeia sozinho (primeiro no Drive, depois no banco): o que deu certo fica, a tela diz quantos foram renomeados e quantos falharam, e clicar de novo continua os que faltam. Cada arquivo renomeado ganha um registro no histórico com o nome antigo e o novo. Ficam de fora os relatórios numerados cujo nome não termina em `_Relatório V<número>` (a tela diz quantos), os relatórios sem número e os outros anexos. O histórico já gravado com "Relatório V2" fica como está. Na produção, a renomeação não espera o primeiro backup, por decisão do usuário.

**Motivo.** Uma letra por coisa: V para versão, R para relatório. Renomear os antigos deixa o Drive igual à tela; a renomeação por arquivo evita que uma falha no fim desfaça centenas de trocas, e o botão usa o login e a permissão que já existem.

## Opções consideradas

- Só os novos com R: menos trabalho, mas a pasta do Drive ficaria com as duas letras misturadas.
- Renomear tudo ou nada: uma falha desfaria a carga inteira.
- Script no terminal do usuário: o login pelo Google complica a autenticação fora do navegador.
- Reescrever o histórico gravado para R: o histórico guarda o nome que o relatório tinha na época.
- Dar nome padrão completo aos relatórios fora do padrão: poderia mudar mais que a letra (sigla, nome do processo renomeado).
