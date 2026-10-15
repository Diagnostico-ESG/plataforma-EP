# 03: Participantes

**Como resolve a sua parte.** Saber quem estava na reunião é metade do registro: quem do EP foi, quem do setor respondeu e quem mais participou. Este ticket acrescenta ao formulário e ao painel os participantes, em três partes: usuários do EP e responsáveis do setor marcados em listas, para o nome sair igual ao cadastro, e outros participantes escritos um por linha. Quando um responsável do setor é excluído, ele continua nas reuniões em que esteve, como outro participante com o nome que tinha.

**What to build:** banco (tabelas `reunioes_usuarios` e `reunioes_responsaveis`, RLS, privilégios, coluna `outros_participantes` já existente passa a ser usada, gatilho do responsável de outro setor, gatilho do responsável excluído, participantes no estado dos eventos); participantes no formulário, no painel e na função de salvar. Spec: `.scratch/reunioes/spec.md` (histórias 9 a 11, 44; seção "Modelo de dados").

**Blocked by:** 01 (Registrar e ver reuniões).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes pgTAP antes da migração, um por célula de "quem pode o quê" para `reunioes_usuarios` e `reunioes_responsaveis`.
- [ ] Banco: responsável de outro setor recusado; trocar o setor da reunião com responsável do setor antigo recusado; excluir responsável presente em 2 reuniões deixa o nome nas duas como outro participante, com evento de alteração; outro participante vazio descartado e nome longo recusado; os eventos da reunião trazem os participantes no antes e depois.
- [ ] Teste antigo de exclusão de responsável do setor conferido com o caso de reunião.
- [ ] Formulário: caixas de marcar com os usuários ativos (de qualquer perfil) e com os responsáveis do setor da reunião; área de texto "Outros participantes", um por linha; trocar o setor desmarca os responsáveis do setor antigo; usuário ou responsável já marcado que ficou inativo ou saiu da lista continua aparecendo marcado.
- [ ] Painel: as três listas de participantes; usuário inativo marcado com pílula.
- [ ] Consulta vê os participantes sem campos editáveis.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima, incluindo o responsável excluído aparecendo como outro participante.
