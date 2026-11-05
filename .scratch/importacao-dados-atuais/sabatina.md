# Sabatina da importação (2026-11-05)

Registro entre etapas: decisões do usuário durante o `grill-with-docs`. As regras de etapa estão em `amostra/cabecalho.md`.

## Rodada 1

- **Q1, como entra na produção:** o usuário escolheu (c), workflow do GitHub Actions. Esclareceu que o que não pode ir ao GitHub são os **arquivos**; a planilha não tem dado sigiloso nem pessoal. Em reavaliação na rodada 2, porque a entrega 2 envia arquivos.
- **Q2, coluna D:** está em branco; fica de fora.
- **Q3, rodar de novo:** processo que já existe (mesmo setor e mesmo nome) é pulado e listado como "já existia"; o importador nunca altera o que já está na plataforma. Prévia antes de gravar.
- **Q4, nome do setor:** entra igual à sigla, completado depois em Cadastros; setor que já existe com a sigla é reaproveitado.
- **Q5, "A definir":** macroprocesso comum, criado pelo importador, com os setores que aparecerem nele.
- **Q6, responsável:** a regra da plataforma (responsável inicial da etapa, ou ninguém; Concluídos sem responsável).
- **Q7, histórico:** um único registro "importado da planilha", com quem importou e quando; a contagem de processo parado começa na importação.
- **Q8, Observações (R):** vão para as Anotações.
- **Q9, casos fora da regra:** VII concluído sem data → Publicação, Finalizado, listado; data da modelagem piloto em processo de Não iniciados → ignorada, listada; data ilegível → ignorada, listada; "Concluído" depois de coluna vazia → vale a última "Concluído", listada como aviso.

## Rodada 2 (todas aceitas como recomendado)

- **Q10, ferramenta:** as duas entregas pela mesma **tela de importação** na plataforma, só para o Administrador, com o login Google dele; gravação pelas regras do banco; histórico registra quem importou. Substitui a escolha (c) da Q1, porque a entrega 2 envia arquivos e eles não podem passar pelo GitHub.
- **Q11, colunas V1 a V8:** a equipe escreve o rótulo completo ("V5F", "V6P", "V7") na coluna do número; o importador confere com o arquivo. Versão 9 ou maior exige coluna nova.
- **Q12, travas de etapa das versões:** ficam de lado só na importação; valem o número único por processo e o .bpm obrigatório; a versão fica marcada com a etapa do processo no momento da importação.
- **Q13, faltando:** versão da planilha sem .bpm na pasta é listada e não entra; as outras do processo entram; .png e relatório ausentes não geram aviso.
- **Q14, sobrando:** arquivo sem versão na planilha, de processo inexistente ou com nome fora do padrão não entra e é listado.
- **Q15, relatórios:** como o nome indica; com número fica ligado à versão do nome; .pdf antigo entra sem número próprio.
- **Q16, rodar de novo:** versão que já existe (mesmo processo e número) é pulada e listada; nenhum arquivo é substituído.

## Rodada 3 (todas aceitas como recomendado; sabatina encerrada pelo usuário)

- **Q17:** tela em Administração → Importação, só Administrador; continua depois da carga.
- **Q18:** linha repetida (mesmo setor e nome): vale a primeira; a segunda é listada.
- **Q19:** Não iniciados entra com A fazer; Concluídos com Finalizado; as demais etapas com Finalizado.
- **Q20:** importados em Concluídos entram já tirados do Quadro.
- **Q21:** testes no desenvolvimento com .csv e arquivos inventados; carga real pelo usuário na produção, pela tela; backup da produção antes da carga real.
- **Q22:** ADR 0044 gravado.
- **Q23:** termo "Importação dos dados atuais" no `CONTEXT.md`.
