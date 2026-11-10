# Próximo passo (2026-11-10)

**Feito:**
- O ticket 07 de revisoes-aprovacao (Duas revisões) está concluído e juntado à `main` (merge 12db76b; último commit do ticket 6ef0915). A branch foi apagada aqui; a remota `revisoes-aprovacao-07` ainda existe no GitHub (apagar é comando seu).
- Testes de banco: 64 de 64 arquivos passaram na branch e de novo na `main`. As duas migrações (`20261110165927_duas_revisoes_etapas` e `20261110171004_duas_revisoes_registro`) estão aplicadas no banco de **desenvolvimento**, e os tipos saíram dele.
- Correção avulsa, já na `main`: a importação da pasta casa o processo apesar de diferença de caixa, acento e espaço repetido.

**Próximo: `/polir` de revisoes-aprovacao (Sonnet)**, com os três pontos anotados no `desvios.md` da funcionalidade (o Agora da Revisão do relatório sem o relatório no topo, o campo obrigatório por último no formulário, o desenho do ícone novo) e o formulário de versão que passa da largura no celular (backlog). Depois vem o `/ship` (Sonnet).

**Ainda não está na produção:** nem as duas migrações, nem o site (o site no ar é o do commit `0451a0e`, sem a seção 2 da Importação nem a correção do casamento da pasta). Depois do `/ship`, publique o banco de produção primeiro e o site depois, pelos roteiros de `.claude/regras/producao.md`, com a sua aprovação.

**Depois, por sua conta:**
- A carga real pela tela: primeiro a planilha, depois a pasta.
- Deixar a visibilidade do site como Público na Netlify.
- Com dados na produção, criar `BACKUP_SENHA_PRODUCAO` e fazer o primeiro backup.

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/polir revisoes-aprovacao
```
