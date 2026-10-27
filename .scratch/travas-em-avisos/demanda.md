# Travas em avisos e versões editáveis (travas-em-avisos)

Demanda de 2026-10-27, pelo `/demanda`: mudança em funcionalidades já entregues (processos-etapas, documentos-versoes, revisoes-aprovacao). Cada parte atualiza a spec da funcionalidade que muda, no mesmo arquivo, com a linha `Em revisão desde 2026-10-27`.

1. **Trava do autor na Revisão interna sai.** Hoje o revisor interno precisa ser diferente de quem enviou o documento, e o banco recusa a escolha. No lugar, só um aviso antes de confirmar ("Quem enviou este documento será também o revisor interno. Manter assim?").
2. **Todo número de versão fica editável**, inclusive os definidos automaticamente (V1F para V1 ou V2). Aviso antes de gravar se a alteração quebrar a regra de sequência de F, P ou T; o aviso não impede. Versões nunca se apagam, então a edição deixa rastro no histórico.
3. **Trava de arquivos vira confirmação.** Hoje, mover da Modelagem piloto para a Modelagem técnica, ou entrar na Revisão interna, sem os arquivos da etapa abre uma janela de envio que barra a passagem. Passa a ser uma confirmação sem barrar:
   > **Faltam os arquivos da Modelagem técnica.** Este processo ainda não tem o fluxograma nem o relatório desta etapa. Você pode avançar agora e enviá-los depois.
   > [Enviar arquivos agora] [Avançar mesmo assim] [Cancelar]

   Mesmo modelo para a Revisão interna. A recomendação a validar na sabatina é manter "Enviar arquivos agora", reaproveitando a janela de envio de hoje. O histórico guarda que o processo avançou sem os arquivos.

Provável migração: os gatilhos do banco hoje barram; passam a só registrar. ADR novo registra o porquê. Dividir em tickets se couber.
