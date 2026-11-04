# Próximo passo (2026-11-04)

**Situação:** a linha de etapas do verso do cartão agora mostra só o ícone (nome como dica e `aria-label`, datas só na gaveta), pelo `/demanda` (ADR 0041, spec de `processos-etapas` com `Em revisão desde 2026-11-04`). Código, CSS e testes feitos e comitados; `npm test` com 3.371 de 3.372 (o que falha é o instável `App.relatorioDepois`, registrado no backlog, que falha também sem a mudança).

**Próximo comando:** `/polir` (Sonnet), porque a mudança é visual. Depois não precisa de `/ship` (sem `package.json`, migração, função ou login); o commit protegido pelo pre-commit basta. A spec fica com `Em revisão desde`; fechar com a marca de entrega só se eu pedir um `/ship`.

**Depende do usuário:** ver o verso com o login real (fileira de ícones sem nome, dica ao passar o mouse).

**Adiados:** os mesmos de antes (ver `.scratch/backlog.md`), mais o teste instável acima.
