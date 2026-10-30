# Desvios de lista-por-setor

## 2026-10-30 — /polir

**Auditoria (`/impeccable audit`).** Detector sem achados novos (0 anti-padrões). Verificação visual em página temporária local com os módulos falsos do projeto (apagada depois), em 800 px de largura:

- Barra da Lista sem a Busca; "Agrupar por" com Nenhum, Macroprocesso e Setor legíveis, o escolhido em azul cheio. Critério 10 da spec atendido.
- Árvore por Setor: setor (faixa azul clara, selo e borda azul em cima), macroprocesso (faixa cinza recuada) e processo se distinguem; o subprocesso de outro setor vem recuado sob o pai, com o selo do setor dele.
- Árvore por Macroprocesso: mesma aparência de antes (faixas, recuos e selos iguais), apesar da troca das classes para `grupo-raiz` e `grupo-filho`.

**Corrigido:** nada; não havia achado a corrigir, então o `/impeccable polish` não aplicou mudança de código.

**Deixado de fora, com o motivo:**
- Aviso do detector em `Quadro.css` linha 262 (`border-radius: 1px` fora da escala do DESIGN.md): já existia antes desta funcionalidade e não é da Lista.
- Celular (375 px): não verificado; o produto é de uso em desktop e o layout para celular é opcional (PRODUCT.md).
- Teclado e leitor de tela: coberto só pelos testes de tela (nomes acessíveis, `aria-expanded`, `aria-pressed`); não conferi o anel de foco no navegador.

## 2026-10-30 — /ship

- **Divergência da spec (pequena):** a implementação foi além da lista de remoções da spec: tirou o parâmetro `substituir` de `useEndereco` e o CSS da busca (`--busca-marca`, `.busca-*`), que só existiam para a Busca, e trocou, nas linhas de grupo da árvore, as classes presas a "macroprocesso" e "setor" por `grupo-raiz` e `grupo-filho`, para a mesma linha servir aos dois agrupamentos. A árvore por Macroprocesso ficou igual na tela (conferido). A spec foi atualizada com este registro.
- **Revisão de código** (`code-review` em dois agentes, padrões e spec): nenhum erro nem critério invalidado; só julgamentos (esqueleto repetido nos quatro ramos da árvore, aceito por serem quatro e de tipos diferentes; teste novo repete as fixtures de outros testes de tela). Nada corrigido.
- **Revisão de segurança:** a mudança só lê o parâmetro `agrupar` do endereço, comparando com valores fixos (`macroprocesso`, `setor`), e remove o parâmetro `busca`; não mexe em login, permissão, dado pessoal, banco nem arquivos. Dispensado o `/security-review`; revisão de reserva feita por leitura do diff.
- **Dependências (passo 3) e banco (passo 7):** pulados; `package.json` e `supabase/` não mudaram desde o marco de início, e `.scratch/security.md` já existe.
