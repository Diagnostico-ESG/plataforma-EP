# Próximo passo (2026-11-03)

**Situação:** todas as funcionalidades da lista do `.scratch/projeto.md` estão entregues (a última, `miniatura-rapida`, em 2026-11-03, com ressalva: a primeira abertura da miniatura continua em cerca de 3 s; no backlog). O usuário trouxe uma demanda de ajustes visuais, classificada no `/demanda` como **mudança em funcionalidade existente** (cadastros-basicos e processos-etapas), e confirmou o caminho.

**Próximo comando:** sessão nova com o Sonnet (modo curto) começando pelo `/situação` e depois:

```
/planejar mudança em cadastros-basicos e processos-etapas: eliminar as cores dos setores (uma cor única, cinza-azulado neutro; a coluna do banco fica sem uso, sem migração); aumentar a pílula da sigla do setor nos cartões; pílulas de cor para a Situação do processo; aumentar os ícones das etiquetas, renomear "Etiquetas" para "Status" e dar cor ao ícone de "A fazer" (azul); mostrar a sigla do setor na visão por setor; mostrar a foto do Google (ou o círculo com a inicial) do responsável no cartão do Quadro e na Lista, mantendo "Você"
```

Pontos para o `/planejar` decidir com o usuário: como mostrar juntos a pílula de Situação e o ícone de Status no cartão sem poluir; "Status" e "Situação" parecem sinônimos na tela; "A fazer" em azul porque o âmbar já é do "Em andamento" (ADR 0032; o usuário sugeriu laranja, recomendei azul e cinza-azulado para o setor); a decisão do cartão sem avatar (proposta 6, `.scratch/proposta-visual/decisoes.md` linha 80, identidade visual linha 173 e o teste de `App.cartaoDoQuadro.test.tsx:162`) é revista e pede ADR novo; a história 231 da spec de processos-etapas já pedia a foto no cartão. Revê os ADRs 0030 a 0033. Fica sem migração se a coluna de cor do setor ficar sem uso.

**Aberto, esperando o usuário:** a foto do responsável no **verso** (linha do Agora). O código já mostra foto ou círculo com a inicial (`FotoDoResponsavel`, com teste), então só vira bug se o usuário mandar uma captura ou descrição do que aparece. Marco `marco/2026-11-03-antes-correcao-foto-do-responsavel` já criado e enviado, para o funil do bug se for o caso (Sonnet; Opus se a causa não aparecer).

**Adiados pelo usuário, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (`src/cadastros/historicoDosCadastros.ts:19`).
2. Nome do setor ao passar o mouse no selo da Lista, do verso e das linhas de grupo.
3. Manutenção sem mudança visual: dividir o `Quadro.css`, ADR das 12 cores do setor (talvez inútil depois da demanda acima), `/impeccable document`.
4. Lentidão da primeira abertura da miniatura (backlog).

**Depende do usuário:** a captura do verso (acima); ver o app com o login real (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção" da spec de `processos-etapas` e o "Deixado como está" de `.scratch/redesenho-do-quadro/desvios.md`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa. Produção: ainda não existe (revisão de pré-produção, projeto do Supabase, hospedagem, rede da TI).
