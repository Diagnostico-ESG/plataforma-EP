# Regra de TDD — DevFlow v2.0.2

Vale para o `/rapido` e para quem a citar. É a nossa versão, feita de duas skills (`/mattpocock-skills:tdd` e `/superpowers:test-driven-development`) mais as regras do projeto. Se uma dessas skills disparar junto, valem as duas, e na dúvida vale a mais rigorosa.

## O ciclo

1. **Vermelho.** Escreva um teste que descreve um comportamento. Rode só esse arquivo e **confirme que ele falha, pela razão certa**: a mensagem de erro é a esperada e a falha é "falta a funcionalidade", não erro de digitação nem de importação. Teste que passa de primeira prova nada: conserte o teste.
2. **Verde.** Escreva o código mínimo que faz o teste passar. Nada de opção, parâmetro ou caso que nenhum teste pede.
3. **Refatore** com tudo verde: nomes, duplicação, funções dentro dos limites das Convenções de Código. Rode o arquivo de teste de novo.
4. Próximo comportamento, outro teste. **Código escrito antes do teste é apagado** e refeito a partir do teste; não vale deixá-lo "de referência".

Sem código de produção sem um teste falhando antes. Exceções só por decisão minha: protótipo descartável, código gerado, arquivo de configuração.

## Onde o teste fica (fronteira)

- Teste **pela fronteira pública**, não por dentro: para tela, pela interface, como a pessoa usa (clicar, digitar, ler o que aparece), com `@testing-library/react`. Para uma função de lógica, pelas entradas e saídas dela.
- No `/rapido`, a fronteira já está fixada na ficha: "a tela inteira". Não pergunte de novo, salvo se a mudança não tem tela.
- Um teste prova **um comportamento** e tem nome que o descreve como uma frase ("mostra o setor no cabeçalho do grupo"). O teste deve sobreviver a uma refatoração que não muda o comportamento.

## Maus testes (não escreva)

- **Preso à implementação:** simula colaborador interno, testa função privada, confere o resultado por um atalho (consultar o banco em vez de usar a interface). Sinal: quebra numa refatoração sem mudança de comportamento.
- **Tautológico:** o esperado é calculado do mesmo jeito que o código (`esperado = a + b` para testar `soma(a, b)`).
- **De cobertura:** escrito só para subir o número. Cobertura é consequência, não alvo (piso de 70% no `/ship`).
- **Vários comportamentos num teste só**, ou teste que depende da ordem de outro.

## Regras do projeto que valem aqui

- Dado de teste é **inventado**; nenhum dado pessoal real.
- O `npm test` **nunca depende do banco ligado**: a interface é testada com as funções de acesso simuladas (classe ou função nomeada, não simulação solta espalhada); o banco é testado em `supabase/tests/` pelo ciclo do projeto.
- Bug corrigido ganha teste de regressão, que **primeiro falha** reproduzindo o bug.
- Teste instável (passa e falha sem mudança) é bug: repita sob carga, compare pela mensagem de erro e conserte antes de seguir.
- Componente nativo do navegador (`dialog`, `popover`): o jsdom pode não suportar; descubra antes de escrever o teste e teste o comportamento observável.

## Ritmo

- Tipos conferidos com frequência (`npm run typecheck`).
- Um arquivo de teste por vez enquanto trabalha (`npx vitest run <arquivo>`).
- A **suíte inteira uma vez**, no fim, antes de comitar. O pre-commit roda só os testes ligados aos arquivos do commit.
