# Próximo passo (2026-11-10)

**Feito:**
- O ticket 07 de revisoes-aprovacao (Duas revisões) está concluído e juntado à `main` (merge 12db76b; último commit do ticket 6ef0915). A branch foi apagada aqui; a remota `revisoes-aprovacao-07` ainda existe no GitHub (apagar é comando seu).
- Testes de banco: 64 de 64 arquivos passaram na branch e de novo na `main`. As duas migrações (`20261110165927_duas_revisoes_etapas` e `20261110171004_duas_revisoes_registro`) estão aplicadas no banco de **desenvolvimento**, e os tipos saíram dele.
- Correção avulsa, já na `main`: a importação da pasta casa o processo apesar de diferença de caixa, acento e espaço repetido.

- `/polir` de revisoes-aprovacao feito (registro no `desvios.md`): o formulário de versão e o cartão da versão cabem no celular, e o relatório vem primeiro no formulário da Revisão do relatório. O Agora sem o que se revisa ficou no backlog, e a decisão é sua.

**Próximo: `/ship` de revisoes-aprovacao (Sonnet).** Não há outro ticket pendente. Há migração nova, então o `/ship` roda as checagens de banco. Depois dele vêm a publicação do banco de produção e a do site.

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
/ship revisoes-aprovacao
```
