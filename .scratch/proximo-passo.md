# Próximo passo (2026-11-03)

**Situação:** a funcionalidade 20, `setor-neutro-e-fotos`, foi planejada no modo curto: spec em `.scratch/setor-neutro-e-fotos/spec.md` e ADR 0039. Marco `marco/2026-11-03-inicio-setor-neutro-e-fotos`. As specs de `processos-etapas` e `cadastros-basicos` ganharam "Em revisão desde 2026-11-03". As demais funcionalidades da lista continuam entregues. Decisões do usuário: Situação em pílula só na Lista, tela do setor e verso (não no cartão); "Status" e "Situação" ficam os dois; selo do setor também no cartão do Quadro por setor; "A fazer" em laranja (o Em andamento já é azul no código).

**Próximo comando:** sessão nova com o Sonnet, começando pelo `/situação` e depois:

```
/executar-complexo .scratch/setor-neutro-e-fotos/spec.md
```

(vários arquivos ligados: cor do setor sai do módulo, da grade, do cadastro, do selo, da caixa de seleção e do Quadro; Status; Situação; avatar no cartão e na Lista. A spec é o único ticket.) Sem migração. Ao terminar: `/polir` e `/ship`.

**Aberto, esperando o usuário:** a captura do verso, se a foto do responsável no verso não aparecer como esperado (o código já mostra foto ou iniciais; marco `marco/2026-11-03-antes-correcao-foto-do-responsavel` já existe).

**Adiados pelo usuário, cada um pelo `/demanda` quando ele pedir:**
1. Bug do histórico: os registros "Moveu o processo" não mostram "Moveu de {etapa} para {etapa}" (`src/cadastros/historicoDosCadastros.ts:19`).
2. Nome do setor ao passar o mouse no selo da Lista, do verso e das linhas de grupo.
3. Dividir o `Quadro.css` e `/impeccable document`.
4. Lentidão da primeira abertura da miniatura (backlog).

**Depende do usuário:** ver o app com o login real (critérios `[visual]` 14 a 18 do redesenho e a miniatura com um .png real); ler as "Decisões tomadas ao escrever esta seção" da spec de `processos-etapas`; conferir o Catálogo de etapas e escolher o responsável inicial de cada etapa. Produção ainda não existe.
