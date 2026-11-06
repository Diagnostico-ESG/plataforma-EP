# Capa na tela de entrada

Status: ready-for-agent

Demanda de 2026-11-06; funcionalidade `capa-de-entrada`, mudança na tela de entrada de `login-perfis` (já entregue). Onde as duas specs divergirem, vale esta. Decisões da conversa curta do `/planejar` (2026-11-06). Prévia aprovada: `.scratch/capa-de-entrada/capa-b.png`, gerada de `.scratch/capa-de-entrada/previa.html?v=b` (as outras variantes da prévia, A, C, D e E, foram vistas e recusadas).

**Como resolve o problema.** Hoje a tela de entrada é um cartão branco solto no fundo cinza, com o selo EP, o título e o botão: funciona, mas não diz de quem é a plataforma nem para que serve, e não tem nada da cara do trabalho do escritório. Esta mudança transforma a tela numa capa dividida: à esquerda, numa coluna branca, o órgão, o título, uma frase sobre a plataforma e o mesmo botão; à direita, em grafite, uma ilustração de um Quadro inclinado com as etapas reais (só os ícones) e cartões "mudos", sobre um fluxograma em traço fino. O login, as regras e as mensagens não mudam.

## Solução

### Coluna do login (à esquerda)

- Fundo branco (`folha`), largura de cerca de um terço da tela (mínimo 380px), conteúdo alinhado à esquerda e centralizado na vertical.
- De cima para baixo:
  - selo "EP" (como hoje, um pouco maior: 56px);
  - "Centro Estadual de Desburocratização (CED)", em linha pequena (12px), seminegrito, maiúsculas, espaçada, em cinza (`texto-2`; decisão: cinza, não azul, para o botão ser o único azul da coluna);
  - o título "Escritório de Processos" (h1, maior que hoje: cerca de 34px, em duas linhas);
  - a frase "Gestão das tarefas e dos documentos do mapeamento de processos da Casa Civil do Paraná." (17px, `texto-2`);
  - o botão "Entrar com a conta institucional", igual ao de hoje (mesmo texto, mesmo comportamento, desativado enquanto verifica);
  - a área de mensagem, com os mesmos estados e textos de hoje (spec de `login-perfis`, "Tela de entrada"): "Verificando seu acesso…", as recusas e a falha de conexão com [Tentar de novo].

### Ilustração (à direita)

- Fundo `grafite`, com um brilho azul suave e uma grade de pontinhos discreta.
- **Quadro inclinado** em perspectiva (como na prévia B), com as 8 etapas do catálogo na ordem, de Não iniciados a Concluídos; o cabeçalho de cada coluna traz **só o ícone** da etapa (os de `src/processos/iconeDaEtapa.ts`), sem nome. O quadro passa da borda direita, como se continuasse.
- **Cartões mudos**, sem texto: selo do setor (forma cinza-azulada), ícone de Status (vazio, meio cheio, cheio), duas barras no lugar do nome, avatar e uma pílula de cor (atraso, vence, aprovado, informativa ou neutra). Um cartão em destaque, na Modelagem piloto, com contorno azul.
- **Fluxograma ao fundo**, em traço branco fraco: início, tarefas, decisão e fim, como num BPMN, no alto e embaixo. Uma linha azul tracejada atravessa o Quadro, como o caminho de um processo.
- A ilustração é decoração: escondida do leitor de tela (`aria-hidden`), sem foco, sem clique. Os cartões e as etapas são desenhados fixos (não vêm do banco: a tela de entrada é vista antes do login).

### Janela estreita

- Abaixo de cerca de 900px de largura, a ilustração some e fica só a coluna do login, centralizada, com respiro lateral de 16px. Sem rolagem para o lado.

### Fora do escopo

- Animação na capa.
- Imagem de fundo em arquivo; a ilustração é feita com HTML, CSS e SVG, com os ícones que já existem.

## Estados da tela

A tela não busca dados no banco. Os estados são os de hoje, sem mudança: verificando, cada recusa, falha de conexão e o estado inicial sem mensagem.

## Critérios de pronto

1. A tela mostra, nesta ordem, o selo EP, a linha do CED, o título "Escritório de Processos" como título principal, a frase e o botão "Entrar com a conta institucional".
2. Os estados e textos da tela de entrada de `login-perfis` continuam iguais e passando nos testes que já existem (`src/App.entrada.test.tsx`, `src/App.conta.test.tsx`).
3. A ilustração fica fora da árvore de acessibilidade (o leitor de tela lê só a coluna do login) e não recebe foco pelo Tab.
4. Nenhuma dependência nova; cores só por variáveis de `src/styles/tokens.css` (as cores novas da ilustração entram lá, num único ponto); os ícones das etapas vêm do componente `Icone`.
5. [visual] Em 1440×900, a tela fica como a prévia `capa-b.png`: coluna branca à esquerda, Quadro inclinado só com ícones à direita, fluxograma ao fundo e linha azul tracejada.
6. [visual] Em janela de 800px de largura, a ilustração some, o login fica centralizado e não há rolagem para o lado.
7. [visual] As mensagens de recusa e de falha aparecem na coluna do login, legíveis, sem empurrar o botão para fora da tela em 1366×768.
8. [visual] A linha do CED, a frase e o título passam no contraste AA sobre o branco.

Spec de origem da tela: `.scratch/login-perfis/spec.md`, seção "Tela de entrada" (nota de 2026-11-06 aponta para esta spec).

Implementado em 2026-11-06 (commit e76b6a3)
