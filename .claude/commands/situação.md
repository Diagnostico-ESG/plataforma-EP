---
description: Mostra, em linguagem simples, em que ponto o projeto está — o que está pronto, o que está em andamento, o que falta — e qual é o próximo comando. Serve de retomada ao abrir uma sessão nova. Não altera nada.
---

Levante o estado do projeto sem alterar nenhum arquivo. Este comando não é uma etapa: não pede o `/cost` nem grava linha de custo.

Se `.scratch/inicio-projeto.md` não existe ou não tem a linha `setup concluído em`, o projeto ainda não foi montado: diga só o que existe em `.scratch/` e aponte o `/projeto` ou o `/setup`, sem rodar git nem `npm test`.

1. Leia o `.scratch/projeto.md` (funcionalidades principais previstas), os tickets de cada funcionalidade em `.scratch/<funcionalidade>/issues/` (concluído é o que tem a linha `Concluído em`) — ou a spec, nas funcionalidades sem tickets (executada é a que tem a linha `Implementado em`) — o plano em andamento (`plano.md` ou `plano-<número>.md`, com as caixas marcadas) e a linha `Entregue em` no fim de cada spec. Leia também o `.scratch/backlog.md`, o `.scratch/inicio-projeto.md`, o `.scratch/melhorias-protocolo.md`, o `supabase/AMBIENTES.md`, o `.scratch/publicacao.md`, o `.scratch/pre-producao.md` e o handoff mais recente (`.scratch/handoff-*.md`), se existirem.
2. Veja o histórico recente de commits, o último marco (`git tag -l "marco/*"`), a branch atual e se há mudanças não comitadas (ou worktree em uso).
3. Rode `npm test` para saber se os testes estão passando.
4. Se houver handoff, compare com o que os arquivos e o git mostram. Se divergirem, valem os arquivos.

Responda em linguagem simples, curta, nesta ordem:

- **Pronto:** funcionalidades entregues (com a marca `Entregue em`; as que têm `Em revisão desde` contam como em andamento) e tickets concluídos.
- **Em andamento:** o que começou e não terminou, e em que etapa do funil parou.
- **Falta:** tickets pendentes, funcionalidades principais do resumo do projeto ainda não planejadas e quantos itens há no backlog.
- **Atenção:** `Volta iniciada em` sem `Volta concluída em` num `desvios.md` (um `/voltar` parou no meio: retome pelo passo 8 dele); linha "vínculo atual" de `supabase/AMBIENTES.md` apontando para produção (uma publicação parou no meio: nenhum comando de banco antes de resolver), testes falhando, mudanças não comitadas, funcionalidade com código pronto mas sem marca de entrega (nunca passou pelo `/ship`), handoff desatualizado em relação aos arquivos, melhorias do protocolo registradas e ainda não levadas à cópia mestra e, no projeto com banco, migrações criadas depois da última publicada em produção (compare `supabase/migrations/` com o registro em `AMBIENTES.md`). Se a produção já existe, avise também quando o "último backup" ou o "último teste de restauração" do `AMBIENTES.md` estiver em "nenhum", tiver mais de 30 dias ou for anterior à última migração publicada, e quando houver commit em `src/` depois do commit registrado em `.scratch/publicacao.md`. Avise ainda quando houver produção em `AMBIENTES.md` ou site publicado em `.scratch/publicacao.md` sem a linha `Revisão de pré-produção em` em `.scratch/pre-producao.md`, ou com ela marcada `(sem banco)` num projeto que hoje tem `supabase/` (se houver a linha `Publicação sem revisão decidida em`, diga que a revisão foi dispensada por decisão minha).
- **Próximo passo:** o comando exato para continuar, com o modelo da tabela do Funil de Trabalho do `CLAUDE.md`. Se o modelo atual da sessão for diferente do recomendado, diga para abrir uma sessão nova com o modelo certo; isso vale mesmo que esta já seja uma sessão nova.
