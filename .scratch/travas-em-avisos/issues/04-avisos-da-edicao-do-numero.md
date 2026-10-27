# 04: Avisos da edição do número

**What to build:** a janela "Editar número" mostra, em amarelo, enquanto se digita e sem impedir [Gravar], os avisos de quando o número novo quebra a ordem: ordem dos tipos deixa de ser histórica → piloto → em sequência; versão em sequência sem a anterior logo antes ("A V9 ficará depois da V7, sem a V8."); versão aprovada ("A V7 foi aprovada, e o E-protocolo cita esse número."). Regras na seção "Travas em avisos" da spec de `documentos-versoes` (histórias 155 a 157; decisão 5).

**Blocked by:** 03 (Editar número da versão)

**Status:** ready-for-agent

- [ ] Função pura que recebe as versões do processo (número, tipo, se é a aprovada), a versão editada e o número novo e devolve a lista de avisos, com teste de cada caso, dos avisos juntos e de históricas e piloto com saltos entre si sem aviso.
- [ ] Os avisos aparecem na própria janela enquanto se digita, com os textos da spec; mais de um aparecem juntos; não há segunda janela de confirmação.
- [ ] [Gravar] grava com os avisos à vista.
- [ ] Testes `App.*` com cada aviso e com os avisos juntos.
- [ ] `[visual]` A janela com a prévia e os avisos cabe em 1366×768.
