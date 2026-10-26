# 06: Data da validação e .pdf da aprovação

**Como resolve a sua parte.** O setor valida o fluxo num dia e protocola a aprovação noutro, e o documento protocolado fica fora da plataforma. Este ticket faz a Validação com o setor guardar a **data da validação**, opcional e editável, e a aprovação aceitar o **.pdf protocolado**, opcional e substituível, na pasta do processo no Drive. Quando uma aprovação nova toma o lugar da anterior, o .pdf antigo fica guardado e aparece no histórico.

**What to build:** os dois registros de ponta a ponta (banco, função do servidor, módulos de revisões e de versões, Agora, gaveta, janela e testes).

- **Banco:**
  - `processos.data_da_validacao` (opcional, não futura), gravada só por `registrar_data_da_validacao`, com o processo na Validação com o setor e em andamento;
  - tabela `pdfs_da_aprovacao`, com `revoke all` e só os privilégios da spec; um .pdf atual por aprovação; `guardado_em` preenchido por `registrar_aprovacao` quando a aprovação é trocada;
  - envio e substituição do .pdf com a regra do editar a aprovação (em andamento ou concluído, não arquivado); nada se apaga;
  - eventos: data registrada e alterada; .pdf enviado e substituído.
- **Função do servidor:** enviar e substituir o .pdf (só .pdf, até 20 MB), nome `CEE_V8_Nome do processo_Aprovação.pdf`; `conferir` e `baixar` cobrindo o .pdf; o arquivo puro de decisão com as operações novas. Termina com o roteiro para o usuário publicar a função no desenvolvimento.
- **Módulos:** `registrarDataDaValidacao` e a leitura do .pdf (atual e guardados) no de revisões; o envio do .pdf pelo de versões; as falsas acompanham.
- **Tela:**
  - Agora da Validação com o setor: o campo da data, no padrão da Data da modelagem piloto; a gaveta com "Validado pelo setor em {dd/mm/aaaa}";
  - janela "Registrar aprovação" com o campo ".pdf protocolado (opcional)";
  - gaveta da Aprovação pelo setor com o .pdf (link, marca da conferência, [Substituir]) ou [Enviar .pdf];
  - o .pdf da aprovação anterior no evento "Substituiu a aprovação", com o link de download;
  - Consulta vê e baixa, sem botões.

Spec: `.scratch/revisoes-aprovacao/spec.md`, seção "Data da validação e .pdf da aprovação (mudança de 2026-10-26)" (histórias 49 a 62).

**Branch:** `quadro-livre-parte-3`. A migração vai ao banco de desenvolvimento pelo workflow "Migrar banco de desenvolvimento".

**Blocked by:** None (can start immediately). Mexe na mesma função do servidor que os tickets 09 a 11 de documentos-versoes: execute um de cada vez.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Testes pgTAP escritos antes da migração e vistos falhar: cada célula da tabela "quem pode o quê" e cada regra da seção (data só na Validação, não futura, alterada e apagada; .pdf só de aprovação existente, um atual, regra do editar, guardado na troca, só conteúdo substituído, nada apagado; eventos). O `40_aprovacao` ganha os casos do .pdf guardado; `10_privilegios_padrao` cobre a tabela nova.
- [x] Testes de interface com o aplicativo inteiro: a data no Agora só na Validação, marcar, alterar, apagar, futura recusada, falha ao gravar, a linha na gaveta depois de sair, Consulta só lendo; registrar a aprovação com e sem .pdf, formato errado e tamanho grande recusados, falha no envio sem registrar; [Enviar .pdf] e [Substituir] na gaveta, sumindo no arquivado e para a Consulta; o .pdf anterior no histórico; as marcas da conferência; os eventos novos.
- [x] O arquivo puro de decisão da função e o nome padrão do .pdf têm testes; os testes dos módulos reais provam as chamadas e as frases das recusas novas.
- [ ] `[visual]` O campo da data da validação no Agora fica alinhado aos outros campos e cabe numa linha.
- [ ] `[visual]` Na gaveta da Aprovação pelo setor, o .pdf aparece como os arquivos das versões; a janela "Registrar aprovação" com o campo do .pdf não passa da altura do notebook (1366×768).

Concluído em 2026-10-26 (commit d7bf043)

Os dois critérios `[visual]` ficam sem marca: a tela foi vista só pelos testes com módulos falsos (a vitrine local está desatualizada e o login real não foi usado). Ver `.scratch/revisoes-aprovacao/desvios.md`, 2026-10-26.
