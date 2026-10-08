# Ambientes do banco

- desenvolvimento: remoto, projeto plataforma-ep-dev (ref yclkzyoebpsxmgpbcbus), região sa-east-1
- produção: ainda não criado
- vínculo atual: yclkzyoebpsxmgpbcbus
- última migração publicada em produção: nenhuma
- último backup de produção: nenhum
- último teste de restauração: nenhum

Observação (2026-10-06): na rede do escritório, só a porta 443 abre. Migrações e testes de banco vão à mão pelo SQL Editor do painel (ver `.scratch/inicio-projeto.md`).

Migrações aplicadas à mão no dev pelo SQL Editor (fora do histórico da CLI; registrar com `npx supabase migration repair --status applied <versão>` numa rede liberada, antes da primeira publicação em produção):

- 20261007200505_login_perfis (2026-10-07; testes 02 e 03 passaram pelo SQL Editor)
- 20261007214206_autorizar_emails (2026-10-07; testes 04, 02 e 03 passaram pelo SQL Editor)
- 20261008125853_gerir_usuarios (2026-10-08; testes 05, 02, 03 e 04 passaram pelo SQL Editor)
