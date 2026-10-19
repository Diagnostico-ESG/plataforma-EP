# 18: Arquivos, reunião, Sobre e Estrutura no verso

**Como resolve a sua parte.** No painel atual, versões, reunião e dados do processo aparecem em blocos do mesmo peso, e o que falta (como o relatório de uma versão) não salta aos olhos. Este ticket redesenha essas seções no verso: a versão mais recente em destaque, com o que falta no lugar dele, as anteriores recolhidas, e a coluna da direita com a reunião marcada ali mesmo, o "Sobre" sem campos vazios e a estrutura do processo. O que cada ação faz não muda.

**What to build:** na coluna esquerda, a seção Arquivos (funcionalidade `documentos-versoes`, outra apresentação): linha de destaque da versão mais recente com número e data em mono e, quando falta algo, a pílula âmbar "falta relatório"; um botão por arquivo ("Fluxograma .bpmn", "Imagem .png", "Relatório .docx") com a barrinha de cor do tipo e o ícone de baixar; o relatório que falta como espaço tracejado [+ Acrescentar relatório] no lugar dele (só para quem pode enviar); [Enviar versão] no título; "Registrar versão histórica" num "⋯" da seção; Substituir no "⋯" de cada arquivo; anteriores recolhidas em "Versões anteriores ({n})"; formulários de envio no lugar da seção, como hoje. Na coluna direita: Reunião com a data em mono, a barrinha amarela e "· próxima" ou "· realizada" (sem data, "Ainda não marcada"), e "Marcar data" ou "Alterar data" virando ali mesmo o campo de data com [Salvar], [Remover] e [Cancelar]; Sobre com setor, macroprocesso, tipo, origem, contexto e observações, rótulo pequeno em cinza acima do valor, textos longos em até 4 linhas com "Ler mais" / "Ler menos", campo vazio omitido; Estrutura com "Subprocessos ({n})" (nome em link e, embaixo, a etapa atual e a situação quando não é em andamento) ou "Faz parte de" com o pai, ausente sem estrutura. Spec: `.scratch/processos-etapas/spec.md` (histórias 123 a 127; "Interface", "Verso do cartão", itens Arquivos, Reunião, Sobre e Estrutura; "Decisões de teste"), com as notas da parte 3 em `.scratch/documentos-versoes/spec.md` e `.scratch/reunioes/spec.md`.

**Blocked by:** 16 (A janela do verso do cartão).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Arquivos: destaque da versão mais recente; "falta relatório" com o espaço [+ Acrescentar relatório] para quem pode enviar; versões anteriores recolhidas em "Versões anteriores ({n})"; "Registrar versão histórica" no "⋯" da seção; Substituir no "⋯" de cada arquivo.
- [x] A Consulta só baixa os arquivos, sem envio, acréscimo, substituição nem versão histórica.
- [x] As marcas atuais de "alterado fora da plataforma" e "não encontrado no Drive" continuam aparecendo.
- [x] Reunião marcada, alterada e removida no próprio lugar, com "· próxima" ou "· realizada"; "Ainda não marcada" sem data; Consulta sem os botões.
- [x] Sobre sem os campos vazios e com "Ler mais" / "Ler menos" no texto longo.
- [x] Estrutura com a etapa atual de cada subprocesso, a situação quando não é em andamento, "Faz parte de" no subprocesso e a seção ausente sem estrutura; os links abrem na mesma janela.
- [x] Os testes de tela atuais de versões e reunião passam ajustados à nova apresentação, mantendo os comportamentos.
- [x] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [x] `[visual]` Nos arquivos, a versão mais recente se lê numa linha ("V2 · 02/10 · falta relatório"), com os botões dos arquivos com a barrinha de cor do tipo e o espaço tracejado do arquivo que falta no lugar dele.
- [x] `[visual]` As pílulas têm cor e texto, nunca só cor.
