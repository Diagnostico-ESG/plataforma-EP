# Sabatina — Anotações do processo (mudança em processos-etapas)

Data: 2026-10-23. Termo no `CONTEXT.md` (**Anotações**); decisão de não ter histórico no ADR 0021.

1. **Posição:** primeiro bloco da coluna da direita do verso (`verso-contexto`), acima da reunião. A reunião (data da modelagem piloto) fica como está, um bloco abaixo.
2. **Forma:** um texto único por processo (bloco de notas compartilhado), guardado no próprio processo. Subprocesso tem as suas, separadas das do pai.
3. **Histórico:** nenhum. Alterar as Anotações não gera evento no histórico do processo (ADR 0021).
4. **Perfis:** Administrador e Integrante do EP ativos escrevem; Consulta só lê; inativo e visitante sem login não veem nada (como o processo hoje).
5. **Situação:** escreve-se em andamento, suspenso, cancelado e concluído. O arquivado só se lê (a regra "arquivado não se edita" continua sem exceção).
6. **Tamanho:** até 2.000 caracteres; a contagem aparece só perto do limite.
7. **Onde aparece:** só no verso. Fica fora do cartão do Quadro, da busca da Lista e das planilhas dos dashboards (o texto livre pode trazer nome e e-mail de pessoas dos setores). Ícone no cartão e busca ficam para o backlog, se fizerem falta.
8. **Salvamento:** grava cerca de 1 segundo depois que a pessoa para de digitar e ao sair do campo, sem botão. Ao lado do título: "Salvando…" e depois "Salvo". Na falha (inclusive sem conexão): "Não foi possível salvar. Seu texto continua aqui", o texto fica no campo e tenta de novo na próxima pausa. Fechar a janela com texto ainda não gravado pede confirmação.
9. **Conflito:** a gravação só acontece se o texto no banco ainda é o mesmo de quando a pessoa começou a escrever. Se outra pessoa alterou antes, a gravação é recusada: aparece "Outra pessoa alterou as anotações enquanto você escrevia", o texto de quem escrevia fica no campo para copiar, e o botão "Ver o texto atual" troca o campo pelo texto do banco.
10. **Última alteração:** abaixo do campo, discreto, "Alterado por <nome> em <dd/mm>, <hh:mm>" (quem gravou por último e quando). Sem anotação gravada, a linha não aparece.
11. **Campo vazio:** para quem escreve, dica "Escreva aqui as anotações do processo"; para Consulta, "Sem anotações.". O campo cresce com o texto até uma altura máxima e depois rola por dentro.
