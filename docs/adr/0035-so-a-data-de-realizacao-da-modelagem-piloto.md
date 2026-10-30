# Só a data de realização da modelagem piloto, sem data agendada

Data: 2026-10-29.

Decisão do usuário (funcionalidade 15, `enxugar-cartao-e-cadastro`, mudança em `processos-etapas`). Substitui a parte do ADR 0013 sobre a data da modelagem piloto, que podia ser marcada antes de acontecer e dizia se a modelagem era próxima ou realizada.

A plataforma deixa de guardar quando a modelagem piloto vai acontecer. A data do processo passa a ser só a de realização: registrada na linha da etapa Modelagem piloto, nas Etapas do verso, com o processo em andamento na Modelagem piloto ou depois dela (nunca em Não iniciados), e nunca no futuro (dia de hoje no horário de Brasília). Sai do cadastro de Novo processo e do lado direito do verso, e com ela os selos "Modelagem hoje" e "Modelagem dd/mm" do cartão. As datas futuras já gravadas no desenvolvimento são apagadas pela migração, porque eram agendas, não realizações. A coluna do banco é a mesma, e a planilha dos dashboards continua com "Data da modelagem piloto", com a conclusão da fase IV no lugar quando a data está vazia.

O motivo: a data agendada confundia o cadastro e o cartão, com duas leituras para o mesmo campo, e a agenda dos encontros com os setores já vive fora da plataforma.

## Opções consideradas

- **Duas datas, agendada e realizada:** mantém a agenda dentro da plataforma, que o usuário não quer.
- **Data futura aceita com aviso:** o campo voltaria a servir de agenda.
- **Editar só com o processo na Modelagem piloto, como a data da validação:** obrigaria a voltar processos antigos ou já adiantados à etapa só para registrar a data.
