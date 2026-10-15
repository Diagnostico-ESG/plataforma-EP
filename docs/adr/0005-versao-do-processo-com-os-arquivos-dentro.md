# A versão é do processo e guarda os arquivos dentro

Data: 2026-10-15.

A especificação separava Documento (fluxograma piloto, fluxograma técnico, relatório), Versão do documento e Arquivo da versão. Ficou um modelo de dois níveis: a **versão** pertence ao processo, tem número sequencial por processo e guarda os arquivos (o .bpmn, o .png, o .bpm opcional e o relatório). "Piloto" e "técnico" deixam de ser tipos de documento; a diferença fica na etapa em que a versão foi enviada.

O padrão de nome dos arquivos já trata fluxograma e relatório como um par com o mesmo número (`CEE_V6_...` e `CEE_V6_..._Relatório`), e a v1 não tem documento solto, sem fluxograma: os e-mails do setor ficam para as rodadas de revisão (funcionalidade 6), e o tipo "outro" ficou fora até aparecer um caso real. Três níveis obrigariam a manter o mesmo número sincronizado entre documentos diferentes.

## Opções consideradas

- Três níveis, como na especificação: comporta documentos de qualquer tipo, mas exige sincronizar o número do relatório com o do fluxograma e cria telas por tipo de documento sem uso na v1.
