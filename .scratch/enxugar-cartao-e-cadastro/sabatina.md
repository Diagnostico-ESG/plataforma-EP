# Sabatina: enxugar o cartão e o cadastro

`/mattpocock-skills:grill-with-docs`, 2026-10-29, com Opus. Base: `demanda.md`.

## Fatos levantados no código

- Há uma só data no banco, `processos.data_da_modelagem_piloto`, que hoje vale para a modelagem marcada e para a realizada; data futura gera o selo "Modelagem hoje" / "Modelagem dd/mm" (`src/processos/selosDoCartao.ts`).
- O processo tem três textos livres: `contexto` e `observacoes` (cadastro e "Sobre" do verso) e `anotacoes` (bloco que se grava enquanto se escreve).
- A planilha interna dos dashboards tem as colunas "Data da modelagem piloto" (sem a data, usa a conclusão da fase IV) e "Observações". Contexto e Origem não vão a planilha nenhuma. A exportação em CSV não existe (ADR 0017).
- A Origem aparece só no cadastro, no "Sobre" do verso e no histórico.
- Precedente: a data da validação é editável no Agora com o processo na Validação com o setor, só leitura fora dela, sem data futura.

## Rodada 1 (todas as recomendações aceitas)

1. Contexto e Observações viram as **Anotações**: um só texto livre no processo, já no cadastro de Novo processo. Sai o bloco de textos do "Sobre".
2. A migração junta o texto já gravado nas Anotações: "Contexto: …", "Observações: …" e depois o que já havia, só os trechos não vazios.
3. A mesma coluna passa a ser a **data de realização da modelagem piloto**: registrada só na etapa Modelagem piloto, sai do cadastro e do lado direito do verso, e não aceita data futura (campo e banco recusam, com a data digitada e o limite). Os selos "Modelagem hoje" e "Modelagem dd/mm" deixam de existir.
4. A **Origem** sai de vez: coluna `origem` e tipo `origem_do_processo` apagados; histórico antigo continua legível.
5. Sem responsável, o verso mostra um texto discreto "Escolher responsável" (só Administrador e Integrante); na frente, nada.
6. O selo "Sem responsável" sai da frente do cartão; a coluna "Sem responsável" do agrupamento por responsável fica.
7. "Documentos do Mapeamento" é só o rótulo da seção do verso, não termo do glossário.

`CONTEXT.md` atualizado: Anotações e Data da modelagem piloto.

## Rodada 2

8. Coluna "Observações" da planilha interna: o usuário disse "esquece a planilha por enquanto". **Escolha padrão (a mais conservadora):** a coluna fica, com o cabeçalho, sempre vazia, para nenhum painel do Data Studio quebrar; o resto da planilha não muda. Decidir depois se a coluna sai (backlog).
9. A data de realização se registra na linha da Modelagem piloto das Etapas, com o processo em andamento na Modelagem piloto ou depois dela; nunca em Não iniciados.
10. A planilha mantém "Data da modelagem piloto", com a conclusão da fase IV no lugar quando a data está vazia.
11. A migração apaga as datas futuras já gravadas. "Hoje" é o dia em Brasília.
12. ADR novo `docs/adr/0035-so-a-data-de-realizacao-da-modelagem-piloto.md`, substituindo a parte do ADR 0013 sobre a data. Origem e textos livres não têm ADR e não ganham um.
