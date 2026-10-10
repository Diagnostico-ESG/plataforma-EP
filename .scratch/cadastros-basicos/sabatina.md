# Sabatina de cadastros-basicos (2026-10-10)

Decisões do usuário, para o `to-spec`. Termos no `CONTEXT.md` (seção "Setores").

## Dados
- **Setor:** nome (obrigatório, único), sigla (obrigatória, única sem diferenciar maiúsculas; 2 a 15 caracteres, letras sem acento, números e hífen; gravada em maiúsculas; pode mudar, e os arquivos já enviados mantêm o nome antigo), observações, ativo. Sem responsável (vai para a funcionalidade 3).
- **Macroprocesso:** nome (obrigatório, único), código (opcional, único quando preenchido), descrição (opcional), categoria opcional (finalístico | apoio | gerencial), ativo. Nome e demais campos editáveis a qualquer momento. Lista ordenada pelo código; sem código depois, em ordem alfabética.
- **Setor envolvido:** macroprocesso + setor (par único) + observação opcional. Editado só no formulário do macroprocesso; a tela do setor mostra, só leitura, os macroprocessos dele. Tirar e pôr setores é livre nesta funcionalidade.

## Permissões
- Administrador e Integrante do EP: criar, editar, desativar, reativar, excluir, ligar e desligar setores.
- Consulta: só lê (inclusive o histórico).
- Visitante sem login e usuário inativo: nada.

## Excluir e desativar
- Excluir sempre, com a janela de confirmação existente (ADR 0003), dizendo o que será apagado ("Excluir o setor CEE e tirá-lo de 2 macroprocessos?"). Exclui junto as ligações de setor envolvido.
- Quando houver processos (funcionalidade 3), o banco recusa excluir setor ou macroprocesso com processo ligado e explica.
- Inativo some das listas de escolha e continua aparecendo, marcado, onde já foi usado; setor inativo continua como setor envolvido.
- Listas de Setores e Macroprocessos mostram só ativos, com opção "mostrar inativos".

## Histórico
- Grava agora, na tabela `eventos` existente: criar, editar, desativar, reativar, excluir (guardando todo o conteúdo do item, inclusive setores envolvidos), ligar e desligar setor de macroprocesso.
- Tela "Histórico" na área Setores, todas as alterações dos cadastros, mais recentes primeiro, com filtro por item; excluídos aparecem com o que tinham. Parecida com o Histórico de usuários. Os três perfis veem.

## Telas
- Tudo na área "Setores" do menu (que já existe sem tela): Setores, Macroprocessos, Histórico.

## Divergências com `.scratch/especificacao.md` (achados)
- Responsável saiu do setor (vai para a funcionalidade 3 com a etapa 1).
- Código do macroprocesso opcional (especificação não dizia).
- Macroprocessos e seus setores saem da Administração (tela 7) para a área Setores.

## Para a funcionalidade 3 (no backlog)
- Responsáveis do setor; todos os perfis veem nome, e-mail e cargo.
- Mover processo entre macroprocessos e o que acontece ao tirar de um macroprocesso um setor com processos nele.

## Lembrete técnico (backlog)
- Toda tabela nova em `public` precisa do `revoke` para passar no teste 10 (privilégios padrão).

Sem ADR: nenhuma decisão é difícil de desfazer.
