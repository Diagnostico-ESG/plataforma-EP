# 01: Registrar e ver reuniões

**Como resolve a sua parte.** Hoje o botão Reuniões da faixa lateral não abre nada, e as reuniões com os setores ficam fora da plataforma. Este ticket cria o registro da reunião no banco, com as regras que o banco impõe e o evento no histórico, e entrega a área Reuniões: a lista com as próximas no topo e as realizadas abaixo, a marca "sem anotações", os filtros por setor, tipo e período, o formulário para registrar uma reunião de sensibilização ou de modelagem (ainda sem participantes) e o painel que mostra a reunião aberta. A Consulta vê tudo sem botões de alteração.

**What to build:** banco (tipo `tipo_de_reuniao`, tabelas `reunioes` e `reunioes_processos`, RLS, privilégios, função de salvar, gatilhos das regras e dos eventos, política de leitura dos eventos de reunião); módulo de reuniões (interface, implementação Supabase e falsa nomeada); área Reuniões com lista, filtros no endereço, formulário de registro e painel. Spec: `.scratch/reunioes/spec.md` (histórias 1 a 8, 12 a 28, 40 e 41; seções "Interface" e "Modelo de dados").

**Blocked by:** nenhum (pode começar já).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes pgTAP antes da migração, um por célula de "quem pode o quê" para `reunioes`, `reunioes_processos` e os eventos de reunião (Administrador, Integrante, Consulta, inativo, visitante).
- [x] Banco: testes das regras: setor inativo recusado; modelagem sem processo e sensibilização com processo recusadas (restrição adiada até o fim da gravação); processo de outro setor recusado; processo cancelado aceito; textos longos recusados e vazios virando nulo; criar gera um evento com o estado completo.
- [x] `00_rls_ligada` e `10_privilegios_padrao` passando com as tabelas novas; a migração aplicada pelo workflow "Migrar banco de desenvolvimento" e registrada em `supabase/AMBIENTES.md`.
- [x] Área Reuniões abre pela faixa lateral: tabela com data e hora, tipo, setor, processos, local e a marca "sem anotações"; próximas (data depois de hoje) no topo, da mais próxima à mais distante; realizadas (hoje e antes) abaixo, da mais recente à mais antiga.
- [x] Filtros por setor, tipo e período (de, até, campos de data nativos), guardados no endereço e restaurados ao recarregar; [Limpar filtros]; "Nenhuma reunião com esses filtros.".
- [x] [Registrar reunião] (Administrador e Integrante) abre o formulário: tipo, setor (só ativos), processos do setor (só na modelagem, em qualquer situação), data, hora opcional, local e anotações; salvar desabilitado enquanto falta tipo, setor, data ou (na modelagem) processo; trocar o setor ou passar para sensibilização desmarca os processos que não cabem.
- [x] Falha ao gravar e cada recusa do banco mostram mensagem em vermelho sem perder o que foi preenchido.
- [x] Clicar numa linha abre o painel da reunião à direita (id no endereço) com todos os dados; setor e processo inativos marcados com pílula; clicar num processo abre o painel dele.
- [x] Estados: carregando; "Nenhuma reunião registrada." (com [Registrar reunião] para quem pode); erro com [Tentar de novo].
- [x] Consulta vê área e painel sem nenhum botão de alteração.
- [x] Funções puras (próxima ou realizada, ordem, filtros a partir do endereço) com testes unitários; tradução de recusas e linhas do banco com testes do módulo Supabase.
- [x] Testes de interface com o aplicativo inteiro e a falsa do módulo de reuniões cobrindo os itens acima.

Concluído em 2026-10-15 (commit ad00a20)
