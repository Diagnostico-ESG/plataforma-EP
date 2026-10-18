# 12: Sem etapas do setor e sem nível no catálogo; a primeira etapa vira Modelagem piloto

**Como resolve a sua parte.** As etapas do setor (identificação dos responsáveis, sensibilização, identificação dos processos) já foram feitas para todos os setores, mas hoje seguram todo processo novo na coluna "Aguardando o setor" e ocupam o topo do painel. Este ticket tira essas etapas, a coluna, o filtro e o nível do catálogo, e faz todo processo começar direto na Modelagem piloto.

**What to build:** Quadro sem a coluna "Aguardando o setor" e processo novo direto na Modelagem piloto; filtros sem a opção (endereço antigo tratado como sem filtro de etapa); painel do processo e tela do setor sem as etapas do setor; catálogo da Administração sem o campo "Nível", com 6 etapas numeradas de 1 a 6 e "Modelagem piloto" em primeiro; eventos antigos de etapa do setor no histórico como "Registro de etapa do setor (recurso retirado da plataforma)". Spec: `.scratch/processos-etapas/spec.md` (histórias 18, 19, 29, 32, 45 a 47, 68 a 77; "Interface"; "Modelo de dados"; "Migração de 2026-10-18", passos 3 a 5). Porquê: ADR 0013.

**Blocked by:** 11 (Responsáveis do setor saem), por mexerem na mesma tela do setor e no mesmo histórico.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: migração nova, com os gatilhos de evento desligados durante as exclusões e a renumeração, apaga os andamentos de etapa do setor, as três etapas de nível setor, o gatilho de criação de setor, a exigência das etapas do setor na sequência, a regra de ordem entre níveis, `andamentos.setor_id`, `etapas.nivel` e o tipo `nivel_da_etapa`; recria a função de acrescentar etapa sem o nível e a view `processos_com_andamento` sem "aguardando o setor" (`security_invoker`, `revoke` de visitante); renumera de 1 a 6 e renomeia `modelagem` para "Modelagem piloto".
- [ ] Banco (pgTAP, antes da migração): catálogo com 6 etapas na ordem e nomes da spec; setor novo sem andamento; processo novo com 6 andamentos pendentes; Modelagem piloto inicia sem depender do setor; a 2 com a 1 pendente recusada; acrescentar etapa sem nível; colunas e tipo apagados; eventos antigos de andamento de setor legíveis por todo perfil ativo. Teste 15 apagado; 17 a 22 ajustados às posições novas; 26 a 31 conferidos (etapa atual da versão continua certa).
- [ ] Quadro: sem a coluna "Aguardando o setor"; processo novo na coluna Modelagem piloto.
- [ ] Lista e filtros: sem "Aguardando o setor"; endereço antigo com o filtro mostra tudo, sem erro.
- [ ] Painel do processo sem as etapas do setor e sem "Ver no setor"; tela do setor sem a seção "Etapas do setor" e sem "Carregando etapas do setor…".
- [ ] Administração: catálogo sem a coluna e o campo "Nível"; sem a mensagem "As etapas do setor precisam vir antes…".
- [ ] Histórico: eventos antigos de andamento sem processo na linha simples; eventos antigos do catálogo com "nível" mostram o campo como veio.
- [ ] Módulo de processos (falsa e Supabase) sem leitura e alteração de etapas do setor; nenhum código morto ligado a elas.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `supabase/AMBIENTES.md` registra a migração.
