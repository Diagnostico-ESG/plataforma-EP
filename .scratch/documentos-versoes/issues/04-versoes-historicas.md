# 04: Versões históricas (V5F)

**Como resolve a sua parte.** Muitos processos já tiveram versões na primeira etapa do trabalho, antes da plataforma, com o sufixo F no nome (V5F). Este ticket deixa a equipe registrá-las à mão, com o número digitado e os arquivos que existirem (basta o .bpm), para que o processo comece de onde realmente começou e a primeira versão nova continue a numeração (V5F → V6). A versão histórica é somente leitura e só pode ser registrada enquanto o processo não tem versão nova.

**What to build:** função do banco que grava a versão histórica com os arquivos e os gatilhos das regras dela; ação `registrar` da função do servidor para histórica; [Registrar versão histórica] no módulo e na seção Versões. Spec: histórias 14 a 21 e 45 (histórica registrada).

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração: histórica com número digitado aceita; número repetido recusado; histórica depois de versão nova recusada; histórica só com .bpm aceita, só com .png recusada, com .bpmn e .png aceita; etapa nula; versão nova depois de V5F recebe V6; relatório opcional só na criação; registrar gera um evento.
- [ ] [Registrar versão histórica] aparece para Administrador e Integrante, com o processo em andamento, só enquanto não há versão nova; abre o formulário com o número (inteiro maior que zero) e os arquivos.
- [ ] A versão histórica aparece com o rótulo `V{n}F`, sem etapa, sem [Substituir] e sem a marca "relatório pendente"; o nome dos arquivos leva o F.
- [ ] Cada recusa vira mensagem na tela; testes de interface com a falsa cobrindo registrar uma e várias, o botão sumindo depois da versão nova e as recusas.
