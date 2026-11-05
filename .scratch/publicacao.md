# Publicação do site (2026-11-05)

- **Hospedagem:** Netlify, site `epccivil` (`https://epccivil.netlify.app`), publicação manual (o usuário arrasta a pasta `dist` no painel). Sem ligação com o GitHub: nada publica sozinho.
- **Primeira publicação:** 2026-11-05, build do commit `cb47757`, apontando para o Supabase de produção (`shiummttjxncahitrjwe`).
- **Como publicar de novo:** (1) `npm run build`, que lê `.env.production.local` (ignorado pelo git; guarda `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` de produção); (2) conferir o `dist` (ref de produção presente; ref de desenvolvimento, `service_role` e `PRIVATE KEY` ausentes; `sb_secret_` só como texto da biblioteca, sem valor); (3) o usuário arrasta `dist` em Deploys, na Netlify. Voltar a uma versão anterior: Deploys → deploy antigo → "Publish deploy".
- **Chaves no site:** só a URL e a chave publicável de produção. Nenhuma chave secreta.
- **Visibilidade na Netlify:** produção e versões prévias "Privado" no teste do login (só a equipe da Netlify abre o site). **Para a equipe usar, mudar a produção para Público** (Site configuration → Acesso para visitantes → Editar visibilidade); a barreira passa a ser o login da plataforma. Preview pode ficar Privado.
- **Login (Google):** cliente OAuth no projeto `plataforma-ep-dev` do Google Cloud, com a origem `https://epccivil.netlify.app` e o retorno `https://shiummttjxncahitrjwe.supabase.co/auth/v1/callback`. Gancho "Before User Created" ligado, cadastro aberto ligado (o gancho e o gatilho do banco recusam e-mail fora do domínio ou sem autorização), Email desligado. Primeiro administrador autorizado pelo SQL Editor. Login testado pelo usuário em 2026-11-05: deu certo.
- **Página provisória** que reservou o endereço: `.scratch/site-provisorio/index.html`, já substituída.
- **Fora desta publicação:** função `planilhas-dos-dashboards` e cofre das planilhas (decisão do usuário, depois); plano Supabase Free; backup manual e teste de restauração (passo 9).
