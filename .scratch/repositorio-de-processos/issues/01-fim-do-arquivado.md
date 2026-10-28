# 01: Fim do Arquivado

**Como resolve a sua parte.** O Arquivado trava o processo concluído e o trata como coisa guardada. Este ticket o remove por inteiro (banco, função do Drive e tela) e prepara o campo que diz se o concluído ainda está no Quadro. Depois dele, o concluído que estava arquivado é editável como qualquer concluído e continua fora do Quadro. Nada novo aparece na tela além do que sai.

**What to build:** spec `.scratch/repositorio-de-processos/spec.md`, seções "Trabalho em curso x portfólio", "Modelo de dados" (inclusive "Quem pode o quê", "Regras que o banco impõe" e "Migração") e a linha da Edge Function em "Interface":

- **Migração destrutiva** (uma só): cria `tirado_do_quadro_em`; copia `arquivado_em` para ela nos concluídos arquivados; tira as travas e as funções do arquivado (`arquivar_processo`, `desarquivar_processo`, os gatilhos e funções de conferência e evento do arquivamento, a liberação de sessão do arquivado e a trava do arquivado em cada função listada na spec); recria a view `processos_com_andamento` sem `arquivado_em` e com `tirado_do_quadro_em` e `no_quadro` (30 dias, regra da spec); apaga `arquivado_em`. Um gatilho garante que `tirado_do_quadro_em` só muda pelas funções do ticket 03 (aqui nenhuma função a grava ainda; vale o gatilho). Os eventos antigos `arquivar` e `desarquivar` do histórico ficam e a tela do histórico continua mostrando-os.
- **Tela:** saem as ações Arquivar e Desarquivar, o selo "Arquivado", o filtro "Arquivados" da Lista e todas as frases e bloqueios de arquivado (verso, Anotações, etiqueta, responsável, mover, arrastar). O concluído segue as regras de qualquer concluído.
- **Edge Function `arquivos-no-drive`:** sai a leitura de `arquivado_em` e a regra "nunca arquivado" do .pdf da aprovação; o teste puro de `conferirProcessoDoPdf` prova a regra nova. Precisa ser publicada de novo no desenvolvimento (por mim).
- **Testes de banco** (pgTAP, TDD): um teste novo que falha antes da migração para cada célula de "Quem pode o quê" e cada regra da spec (inclusive update direto recusado mesmo para Administrador e `no_quadro` com 29 e 31 dias); os testes antigos do arquivado (49, 50, 52, 53, 55, 60, 61, 62, 65 e os de 39, 41 e 44) perdem o que provava a trava e mantêm o resto. A migração é ensaiada antes de aplicada. Tipos (`database.ts`) gerados de novo.
- **Testes de tela:** `App.arquivamento.test.tsx` e `App.listaDosArquivados.test.tsx` saem ou se adaptam; testes de que o concluído (que estava arquivado) aceita mover, etiqueta, responsável, Anotações e registrar publicação.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A migração cria `tirado_do_quadro_em`, copia o dos concluídos arquivados e apaga `arquivado_em`; suspensos e cancelados que estavam arquivados viram comuns
- [ ] A view traz `tirado_do_quadro_em` e `no_quadro` (falso com `entrou_em` de 31 dias atrás, verdadeiro com 29; sair de Concluídos e voltar recomeça a contagem)
- [ ] `tirado_do_quadro_em` não se grava direto, nem pelo Administrador
- [ ] As funções e os gatilhos do arquivado e as travas "não arquivado" não existem mais; o concluído que estava arquivado aceita mover, etiqueta, responsável, Anotações, registrar publicação, anexo e editar número da versão
- [ ] Não há mais Arquivar, Desarquivar, selo "Arquivado" nem filtro "Arquivados" na tela; endereço antigo com `arquivados=esconder` é ignorado
- [ ] O histórico antigo de arquivar e desarquivar continua legível
- [ ] pgTAP cobre cada célula de "Quem pode o quê" com os cinco tipos de usuário; todos os arquivos de teste de banco verdes
- [ ] `conferirProcessoDoPdf` sem a regra do arquivado, com teste
- [ ] Tipos regenerados; `npm test` verde
