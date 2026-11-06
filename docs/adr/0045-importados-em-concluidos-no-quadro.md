# 0045 — Processos importados em Concluídos entram no Quadro

Data: 2026-11-06. Estado: aceito. Revoga a Q20 da sabatina da importação (`.scratch/importacao-dados-atuais/sabatina.md`).

**Contexto.** A sabatina de 2026-11-05 decidiu que o processo importado em Concluídos entrasse já tirado do Quadro, para o Quadro não nascer lotado. Na carga do desenvolvimento, o usuário contou 69 processos no Quadro de 111 importados e pediu: "quero todos no quadro".

**Decisão.** A função `importar_processo` deixa de gravar a marca de tirado do Quadro. O importado em Concluídos segue a regra de todo concluído (CONTEXT.md, "Concluídos"): fica na coluna até alguém tirá-lo ou até completar 30 dias em Concluídos, contados da importação.

**Alternativa descartada.** Manter todo concluído no Quadro para sempre mudaria a regra dos 30 dias para a plataforma inteira, não só para a importação.
