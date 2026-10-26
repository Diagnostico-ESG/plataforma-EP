# Sabatina — parte 4 (Outros anexos), 2026-10-26

Muda `documentos-versoes`. Parte das decisões do mapa (`.scratch/quadro-livre/mapa.md`, Q17) e das partes 1 a 3, que não foram reabertas. Todas as recomendações foram aceitas pelo usuário ("Ok para tudo", nas duas rodadas). Termos novos no `CONTEXT.md`: **Anexo** e **Retirar anexo**. ADR novo: 0027 (o anexo se retira e vai para a lixeira do Drive).

## O anexo

1. **Retirar, sem substituir (ADR 0027):** o anexo sai da lista, o arquivo vai para a lixeira do Drive (apagado de vez em 30 dias) e o histórico guarda nome, quem e quando. Para trocar, retira-se e envia-se de novo.
2. **Tamanho:** até 20 MB, como os demais arquivos, com o aviso antes do envio.
3. **Formatos:** .pdf, .docx, .xlsx, .png, .jpg, .jpeg e .eml.
4. **Nome:** o original, como veio (sem o nome padrão, porque o anexo não tem número).
5. **Pasta no Drive:** subpasta "Anexos" dentro da pasta do processo, criada no primeiro anexo.
6. **Sem descrição:** o nome do arquivo e a etapa bastam; o que faltar vai nas Anotações.
7. **Quem envia e quando:** Administrador e Integrante do EP, com o processo em andamento, como nas versões. Suspenso, cancelado, concluído e arquivado só leem e baixam; por isso, em Concluídos não entra anexo (diverge do "em todas as etapas" do mapa, por decisão do usuário).
8. **Quem vê:** todo perfil ativo vê e baixa, inclusive a Consulta e inclusive o .eml (a validação de LGPD pelo jurídico segue no backlog).
9. **Etapa marcada:** a etapa atual do processo no envio, fixa.
10. **No verso:** lista única "Outros anexos" em todas as etapas, do mais recente ao mais antigo, cada linha com a etapa, quem enviou e a data, e [Enviar anexo].
11. **Subprocesso:** tem os próprios anexos, na própria pasta; o pai não mostra os dos filhos.
12. **Histórico, conferência e planilhas:** envio e retirada entram no histórico do processo; os anexos entram na conferência com o Drive; ficam fora das planilhas dos dashboards. A exportação em CSV não existe (backlog, ADR 0017).

## Retirada

13. **Quem retira:** qualquer Administrador ou Integrante do EP, não só quem enviou.
14. **Sem motivo:** só uma confirmação ("Retirar 'resposta.eml'? O arquivo vai para a lixeira do Drive e some em 30 dias.").
