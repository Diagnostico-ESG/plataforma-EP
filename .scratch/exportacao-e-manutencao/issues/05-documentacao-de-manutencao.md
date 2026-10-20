# 05: Documentação de manutenção

**Como resolve a sua parte.** A manutenção pode passar à TI do CED ou a outra equipe. Este ticket deixa em `docs/manutencao/`, em português, o que alguém precisa para assumir o sistema sem depender de quem o construiu.

**What to build:** documentos em `docs/manutencao/`:

- instalação do ambiente de desenvolvimento;
- publicação (banco, funções e site);
- backup e restauração;
- modelo de dados em linguagem de manutenção;
- índice dos ADRs, uma linha cada;
- planilhas e dashboards: cofre do banco, conta de serviço e Sheets, fase de uma etapa nova, roteiro para refazer cada dashboard do Data Studio (a partir das anotações do ticket 04), troca do link na página do EP no site da Casa Civil, fim do Power BI e exclusão da planilha manual depois do cadastro dos processos atuais.

O que depende da produção, que ainda não existe, vai com o que se sabe hoje, marcado para conferir no `/ship` de produção. Nenhum nome de pessoa, e-mail, chave ou identificador real de planilha. Spec: histórias 48 a 55.

**Blocked by:** 04 (as anotações dos dashboards).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Os seis temas existem em `docs/manutencao/`, com um índice que aponta para cada um.
- [x] Cada roteiro é uma lista numerada, um passo por linha, com o caminho completo de arquivo ou pasta e o endereço da página quando há.
- [x] O que depende da produção está marcado como "conferir no `/ship` de produção".
- [x] O índice dos ADRs cobre do 0001 ao último, uma linha cada.
- [x] Nenhum dado pessoal, segredo ou identificador real nos documentos.
