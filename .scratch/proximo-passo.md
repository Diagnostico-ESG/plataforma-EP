# Próximo passo (2026-11-05)

**Onde estamos:** produção no ar. Banco com as 78 migrações e catálogo conferido; função `arquivos-no-drive` publicada; login com Google funcionando; site publicado em `https://epccivil.netlify.app` (Netlify, publicação manual). Detalhes em `.scratch/pre-producao.md` e `.scratch/publicacao.md`.

**Faltam, nesta ordem (passos 9 e 10 de `.scratch/roteiro-producao.md`):**
1. **Primeira conferência com dado de verdade (passo 10):** criar um processo, enviar uma versão e um anexo pelo Drive de produção, retirar o anexo (lixeira) e conferir a pasta no Drive "EP – produção". Fazer com dado inventado e apagar depois.
2. **Backup e prova de restauração (passo 9): adiados por decisão do usuário (2026-11-05), porque a produção ainda não tem dado.** O workflow "Backup do banco de produção" já está pronto (a636a2f); falta criar o segredo `BACKUP_SENHA_PRODUCAO` e rodá-lo. O plano é Free, sem backup automático, e a produção passa a ter dado real assim que o usuário começar o teste manual com processos reais. O backup é a primeira coisa a fazer depois desse primeiro cadastro real, e o teste de restauração se faz no Docker local (o Free não permite um terceiro projeto).
3. **Mudar a visibilidade da produção na Netlify para Público** quando a equipe for usar (a barreira passa a ser o login).
4. Autorizar os demais usuários pela Administração da plataforma.

**Abertos:** `planilhas-dos-dashboards` e cofre das planilhas (decisão do usuário: depois); projeto do Google do login (hoje `plataforma-ep-dev`, institucional ou não a confirmar); plano Free (decisão do usuário); importação dos dados atuais (`/planejar importacao`); `.env` no `.gitignore` (backlog); decisões de LGPD com o encarregado, o jurídico e a TI; `marco/2026-11-05-publicacao` criado.

Modelo: Sonnet para os passos 1 e 2.
