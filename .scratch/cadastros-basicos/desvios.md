# Desvios — cadastros-basicos

Só entradas novas, datadas.

## 2026-10-13 — /polir dos tickets 01 a 05

Auditoria do Impeccable (17/20) sobre `src/components/cadastros/`; o detector automático não achou nada. Conferência visual na tela real não feita (login do Google barra a sessão): fica para o usuário.

**Corrigido**
- **Campos de formulário sem estilo (P2):** `input`, `select` e `textarea` dos cadastros usavam o visual padrão do navegador. Ganharam o desenho dos campos da Administração (32px, borda de token) em `Cadastros.css`, restrito a `.cadastros`, sem mexer nas outras telas.
- **Estados sem dados sem estilo (P2):** `.cadastros-vazio` não existia no CSS; agora usa o texto secundário, como o aviso do histórico.
- **"Carregando…" sem aviso a leitor de tela (P3):** `role="status"` em `SetorAberto`, `MacroprocessoAberto` e `AreaDeHistorico`.

**Deixado de fora**
- **Tabelas sem rolagem em tela estreita (P3):** o produto é para desktop (PRODUCT.md); celular é opcional.
- **Alvos de toque de 32px (P3):** é o padrão do projeto todo.
- **Classes `historico-*` e `linha-fantasma` vindas de `Administracao.css` (P3):** acoplamento comentado no código; mover para um CSS compartilhado é refatoração, fora do polimento.

## 2026-10-13 — /ship

Revisão de código (`/mattpocock-skills:code-review`, desde `4c4b110`, fim da entrega de testes-banco-actions: o marco `marco/2026-10-09-inicio-cadastros-basicos` pegaria também aquela entrega) e revisão de segurança.

**Critérios marcados como feitos sem teste (invalidados pela revisão e corrigidos)**
- Ticket 05, "ninguém inclui, altera ou apaga evento": o inativo não era testado em `14_historico_dos_cadastros`. Acrescentado (4 conferências, 29 de 29 no GitHub Actions); passou de primeira.
- Ticket 02, "excluir … item que não existe mais": só havia o teste de desativar um setor já excluído. Acrescentado o de excluir (`App.excluirSetor.test.tsx`); passou de primeira.

**Teste antigo desatualizado pela funcionalidade**
- `03_login_leitura` ("Integrante não lê eventos") contava todos os eventos e esperava zero. Desde o ticket 05 o Integrante lê os eventos dos cadastros; o teste só passava porque o banco de desenvolvimento não tinha eventos de cadastro gravados, e falhou (8 eventos) depois da conferência na tela do usuário. Passou a contar só os eventos de usuários e autorizações.

**Implementação diferente do texto da spec (aceita pelo usuário; spec atualizada)**
- Janela de exclusão: singular com 1 ("sai de 1 macroprocesso", "1 setor deixa de estar envolvido nele") e, também no macroprocesso, o texto começa por "O histórico guarda…" com zero.
- Textos não previstos: "Nenhum macroprocesso ativo para mostrar.", "Carregando setor…", "Carregando macroprocesso…", "O nome do setor é obrigatório." e "O nome do macroprocesso é obrigatório.".
- Banco: a observação do setor envolvido é guardada sem espaços nas pontas, e a vazia como nula; gravação sem mudança não gera evento (sem teste próprio em `setores_envolvidos`).
- Ordem pelo código: alfabética do texto ("MP10" antes de "MP2"). Mantida por decisão do usuário até se conhecer o formato dos códigos (backlog, item 11.7).

**Padrões de código (para o backlog, decisão do usuário)**: nomes genéricos nos módulos de macroprocessos e setores envolvidos, lógica de recusa repetida, telas de setor e macroprocesso quase iguais, entidades e ações como texto solto, script `aplicar-migracao.mjs` com duas funções sem teste e o ramo de exclusão das funções antigas de evento que deixou de rodar.

**Revisão de segurança**: `/security-review` não achou diferença com a principal (já integrada); revisão de reserva das mudanças desde `4c4b110`, sem achado com confiança 8 ou mais. Reforço opcional, não achado: `aplicar-migracao.mjs` não confere o certificado do banco.
