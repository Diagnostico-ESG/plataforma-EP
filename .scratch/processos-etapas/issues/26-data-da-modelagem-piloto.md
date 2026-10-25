# 26: Data da modelagem piloto

**Como resolve a sua parte.** A data do encontro do EP com o setor ainda se chama "reunião" no banco, na tela e no histórico, e só se marca no verso, depois do cadastro. Este ticket dá ao dado o nome do domínio, **Data da modelagem piloto**, em toda a plataforma, e já o sugere com o dia de hoje no cadastro, que é o caso mais comum. O cartão só lembra da data enquanto ela ainda importa: antes de acontecer e com o processo em Não iniciados ou na Modelagem piloto.

**What to build:** a Data da modelagem piloto de ponta a ponta (spec de processos-etapas, seção "Cartão e verso (mudança de 2026-10-25)", partes "Data da modelagem piloto" e "Modelo de dados"):

- **Banco:** migração não destrutiva que renomeia `processos.data_da_reuniao` para `processos.data_da_modelagem_piloto`, recria a view `processos_com_andamento` e a função do pacote das planilhas com o nome novo (chave do pacote `data_da_modelagem_piloto`) e faz os gatilhos de evento gravarem a chave nova; os eventos antigos ficam como estão. Os valores existentes são preservados; os nulos continuam nulos. Tipos regenerados.
- **Planilhas:** a leitura e a validação do pacote na Edge Function `planilhas-dos-dashboards` passam à chave nova; a republicação da função no desenvolvimento é passo do usuário (`docs/planilhas-publicar-a-funcao.md`).
- **Módulo de processos (real e falso):** cadastro, leitura e linha da Lista com o nome novo; o cadastro aceita a data.
- **Novo processo:** campo "Data da modelagem piloto" preenchido com o hoje de Brasília, editável e apagável; o Editar continua sem o campo.
- **Verso:** a seção "Reunião" vira "Data da modelagem piloto", com os mesmos "· próxima" e "· realizada", marcar, alterar e apagar; a Consulta e o arquivado só leem.
- **Cartão:** o selo "Modelagem {DD/MM}" ou "Modelagem hoje", só com a data hoje ou futura **e** o processo em Não iniciados ou na Modelagem piloto.
- **Histórico:** "Data da modelagem piloto" como rótulo da chave nova e da antiga.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] O teste pgTAP da antiga data da reunião, passado ao nome novo (mesmas regras: Administrador e Integrante alteram, Consulta só lê, desativado e visitante nada, processo arquivado recusado, cada mudança vira evento), falha antes da migração e passa depois; `17_processos`, `44_pacote_das_planilhas`, `00_rls_ligada` e `10_privilegios_padrao` verdes (Docker local e, na conferência final, "Testes de banco" do GitHub Actions).
- [ ] A migração aplicada no desenvolvimento pelo workflow "Migrar banco de desenvolvimento", com os dados existentes preservados.
- [ ] Os testes do pacote das planilhas usam a chave nova, inclusive a recusa de data fora do formato AAAA-MM-DD.
- [ ] O formulário de Novo processo abre com a data de hoje; salvar com ela, com outra data e com o campo vazio grava o que estava no campo.
- [ ] O verso mostra "Data da modelagem piloto" com "· próxima" ou "· realizada"; marcar, alterar e apagar funcionam; a falha mostra "A Data da modelagem piloto não foi salva: {motivo}."; a Consulta só lê.
- [ ] O cartão mostra "Modelagem {DD/MM}" (data futura) e "Modelagem hoje" em Não iniciados e na Modelagem piloto; não mostra com a data passada nem em outra etapa com a data futura.
- [ ] O histórico mostra "Data da modelagem piloto" num evento novo e num evento antigo (chave `data_da_reuniao`).
- [ ] Nenhum texto "Reunião" sobra na tela (testes `App.*` ajustados ao nome novo).
- [ ] `[visual]` O formulário de Novo processo mostra a Data da modelagem piloto alinhada aos outros campos.
