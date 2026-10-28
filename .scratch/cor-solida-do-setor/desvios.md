# Desvios — cor-solida-do-setor

Só recebe entradas novas, datadas.

## 2026-10-28 — /polir (audit + polish do Impeccable)

Escopo: o que o commit `39cd830` mudou (selo, faixa do cartão, cabeçalho da coluna por setor, quadradinho das caixas, amostras da grade e o módulo `corDoSetor.ts`).

**Audit (19/20, Excelente):**
- Detector: 0 achados. Um aviso consultivo em `Quadro.css:252` (`border-radius: calc(var(--canto) - 1px)` fora da escala de raios) é falso positivo e anterior a esta funcionalidade: o raio é derivado do token `--canto`, para a faixa encostar no canto de dentro do cartão. Deixado como está.
- Contraste: a sigla escura passa de 4,5:1 sobre o tom claro das 30 cores (teste automático). O ponto de "em uso" e a linha da amostra escolhida usam `--texto` sobre o tom claro.
- Proteção do modo de contraste forçado (`forced-color-adjust: none`) continua no selo, no quadradinho, na amostra e na coluna.
- Nenhuma variável `--cor-escuro` sobrou nas folhas de estilo; a barra de etapas segue em degradê azul.

**Polish:** nenhuma correção necessária.
- Conferência visual numa página de teste com as folhas de estilo reais do projeto (Edge sem janela, 900×520): selo, faixa do cartão, cabeçalho da coluna por setor, quadradinho das caixas e amostras aparecem com a cor lisa, iguais entre si; o cabeçalho liso se destaca do fundo tingido da coluna; a coluna inativa continua cinza; a amostra em uso mostra o ponto no canto sobre o fundo liso e a escolhida tem a linha acesa.

**Deixado de fora:**
- Conferência na aplicação rodando com o login real (critérios `[visual]` 5 a 7 da spec no app de verdade): o login no Supabase de desenvolvimento é do usuário. A página de teste usa as mesmas classes e folhas de estilo, mas a marcação foi montada à mão; fica presumido, como nas entregas anteriores com a cor do setor.
