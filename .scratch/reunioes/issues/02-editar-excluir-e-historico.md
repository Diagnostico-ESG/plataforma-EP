# 02: Editar, excluir e histórico da reunião

**Como resolve a sua parte.** Depois de registrada, a reunião precisa ser corrigida (data errada, anotações preenchidas depois, processo esquecido) ou tirada (a reunião não aconteceu), sem que nada se perca. Este ticket entrega a edição de todos os campos, a exclusão com confirmação e a aba Histórico da reunião, e leva os eventos de reunião ao histórico geral, com o que mudou, quem e quando.

**What to build:** [Editar] e [Excluir] no painel da reunião; edição pelo mesmo formulário, inclusive troca de tipo e de setor; exclusão pela janela de confirmação; aba Histórico; textos dos eventos de reunião; eventos de reunião no histórico geral; reunião que não existe mais. Spec: `.scratch/reunioes/spec.md` (histórias 29 a 31, 37 a 39; seções "Interface" e "Regras que o banco impõe").

**Blocked by:** 01 (Registrar e ver reuniões).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes pgTAP de alterar e apagar por perfil; trocar o tipo para sensibilização tirando os processos na mesma gravação aceito; trocar o setor com processo do setor antigo recusado; alterar e excluir geram um evento cada, com a exclusão trazendo tudo no "antes"; salvar sem mudança não gera evento.
- [ ] [Editar] (Administrador e Integrante) abre o formulário preenchido; trocar setor ou tipo desmarca o que não cabe; salvar atualiza lista e painel.
- [ ] [Excluir] pede confirmação; Esc ou cancelar não apaga; excluir tira a reunião da lista e fecha o painel.
- [ ] Falha e recusa ao editar ou excluir mostram mensagem em vermelho sem perder o que foi preenchido.
- [ ] Aba Histórico da reunião: criação, alterações (o que mudou) e exclusão, com autor e data; textos dos eventos com testes unitários.
- [ ] Eventos de reunião aparecem no histórico geral, junto com os demais.
- [ ] Reunião excluída por outra pessoa: o painel avisa que ela não existe mais.
- [ ] Consulta não vê [Editar] nem [Excluir].
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.

Concluído em 2026-10-15 (commit e3927d2)
