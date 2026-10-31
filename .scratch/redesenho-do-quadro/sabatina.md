# Sabatina do redesenho-do-quadro (2026-10-31)

Funcionalidade 18 de `.scratch/projeto.md`; muda a spec de processos-etapas. Fonte visual: `.scratch/proposta-visual/proposta-6.html`, `verso-3.html` e `lista-e-cadastros.html` (só o controle Situação), com as medidas de `.scratch/identidade-visual.md` (base 14px). Regras gerais em `.scratch/proposta-visual/decisoes.md`. ADR novo: 0037 ("Destacar os meus"). `CONTEXT.md` sem mudança: nenhum termo do domínio mudou.

## Decisões

1. **Prazo e contador de arquivos ficam fora.** O prazo não existe ainda (v1.5); o contador pediria mudar a view do banco. Os dois vão para o backlog. O cartão continua sem 📅 e sem 📎.
2. **Os três quadros continuam:** por etapa, por responsável (uma coluna por pessoa) e por setor (uma coluna por setor). As Linhas entram só no Quadro por etapa.
3. **Forma de ver:** o botão "Quadro ▾" da faixa de controles abre um menu com Quadro por etapa, Quadro por responsável, Quadro por setor e Lista, e mostra o nome da escolhida. Sai o "Agrupar por" do Quadro e o "Quadro | Lista" da barra de cima. "Linhas" só aparece no Quadro por etapa; "Situação" só no Quadro por setor. Os controles mudam só ao trocar de forma de ver, nunca ao ligar um filtro.
4. **Faixa de controles:** 56px de altura fixa: [Cadastrar processo] (azul cheio), "Quadro ▾", Linhas, separador, [Filtros n], [Destacar os meus], legenda das etiquetas na ponta direita.
5. **Linhas: Nenhuma | Setor | Responsável** (Quadro por etapa):
   - só as linhas com algum cartão depois dos filtros;
   - Setor: ordem pela sigla; cabeçalho da linha com o selo (nome ao passar o mouse e para o leitor de tela) e a contagem; o selo sai dos cartões;
   - Responsável: ordem alfabética, "Sem responsável" por último, pílula "Inativo" para quem foi desativado, "Você" para a própria pessoa; a linha do responsável sai dos cartões;
   - cada linha se recolhe pela setinha, sem guardar o estado;
   - arrastar move só entre colunas da mesma linha; soltar em outra linha não faz nada e mostra um aviso curto;
   - a coluna Concluídos aparece nas linhas, com a regra dos 30 dias;
   - a escolha fica no endereço da página.
6. **Filtros:** o botão abre um painel preso a ele com os cinco seletores de hoje (Setor, Macroprocesso, Etapa atual, Tipo, Responsável) e "Limpar filtros"; o contador mostra quantos estão ligados; fecha com Esc ou clique fora; os filtros continuam no endereço.
7. **Destacar os meus** (ADR 0037): esmaece os cartões dos outros, sem filtrar; separado do filtro Responsável; sem processo da pessoa, todos esmaecidos e o aviso "Nenhum processo com você agora."; no endereço da página; não aparece para Consulta. Substitui as histórias 169 a 171.
8. **Situação na Lista:** "Situação: Todos | Em andamento | Suspensos | Concluídos | Cancelados", com Todos sem os cancelados (regra do `CONTEXT.md`, ADR 0034 intacto). Sai o "Mostrar cancelados (n)" do pé da tabela. O Quadro por setor usa o mesmo controle no lugar do "Todos | Concluídos".
9. **Barra de cima e faixa lateral:** barra com título, busca, sino e avatar; faixa com Processos, Setores, Painel, Administração e Ajuda. A busca e o sino abrem um aviso curto "Em breve"; Painel e Ajuda abrem uma tela simples "Em breve" com uma frase do que virá (Painel: v1.5).
10. **Ícone por etapa** pelo `codigo` fixo da etapa, sem migração; etapa nova criada pelo Administrador recebe um ícone genérico. Aparece no cabeçalho da coluna, nas Linhas e na trilha do verso.
11. **"Você"** no cartão do Quadro quando o responsável é a própria pessoa (no verso já é assim).
12. **Verso enxuto** (verso-3, janela fixa 880 × 740, não cresce):
    - sem abas; a ação principal da etapa atual no topo como botão azul (Registrar revisão, Registrar aprovação, Registrar publicação);
    - os campos da etapa (datas, E-protocolo) numa linha logo abaixo dos avisos;
    - estrutura e dados do processo na linha de dados do cabeçalho;
    - arquivos da versão em lista vertical com o selo do tipo em mono; Versões anteriores e Outros anexos recolhidos;
    - **Anotações como hoje** (escreve direto, grava sozinho, sem "Editar" e sem linha de autor), com o dobro do espaço;
    - Histórico no menu "···", abrindo no lugar do processo com "Voltar ao processo" (já é assim hoje), sem o filtro "Tudo | Etapas | …" (backlog).
13. **Miniatura do fluxograma:** busca o .png da versão mais recente pela função `arquivos-no-drive` (ação baixar) ao abrir o verso. Carregando: quadro cinza. Sem .png: quadro com o ícone do fluxograma e "Sem imagem (.png) nesta versão". Erro (inclusive sem conexão): "Não foi possível carregar a imagem". Clicar abre o .png inteiro. Prova com o login real depende de a função estar publicada no desenvolvimento.

## Perfil Consulta

Vê a faixa, "Quadro ▾", Linhas, Filtros e a legenda; não vê "Cadastrar processo" nem "Destacar os meus"; não arrasta.
