# Foto acompanha o Google; na Administração, só grava o que foi confirmado

Data: 2026-10-08.

Três ajustes em login-perfis, achados depois da construção (backlog, 2026-10-08), mudam regras já escritas na spec:

- **Foto.** A spec copiava a foto da conta Google só no primeiro acesso, e quem trocava a foto no Google continuava com a antiga. Agora a foto acompanha o Google a cada entrada, também para o usuário inativo; sem foto no Google, a plataforma mostra as iniciais. O nome não acompanha, para não desfazer a correção do administrador. A troca de foto não entra no histórico: o histórico registra decisões de alguém sobre o acesso, e guardar fotos antigas iria contra o mínimo necessário da LGPD.
- **Mudar perfil.** O seletor gravava a cada opção escolhida, e no Windows cada seta do teclado virava uma troca de perfil e um evento no histórico. Agora escolher não grava: Salvar grava, Cancelar volta ao perfil gravado, como no "Corrigir nome".
- **Confirmação.** Pedem confirmação só as ações que tiram acesso ou apagam: Excluir autorização e Desativar. Reativar é o próprio desfazer do Desativar e segue com um clique. A confirmação é uma janela nativa do navegador, com o verbo da ação no botão e o Cancelar selecionado ao abrir.

Junto, a cor das mensagens: vermelho para "a ação não aconteceu" (falha ao carregar ou salvar, recusa do banco), amarelo para aviso (perfil sem permissão).

## Opções consideradas

- Gravar o perfil ao sair do campo: grava sem querer quando alguém escolhe por engano e clica fora.
- Confirmar por segundo clique no mesmo botão: fácil de acionar por engano, e o leitor de tela pode não anunciar a troca do texto.
- Desfazer em vez de confirmar: exige segurar a gravação por alguns segundos; mais código para o mesmo efeito.
- Confirmar também Reativar e mudar perfil: confirmação em tudo faz as pessoas clicarem sem ler.
- Botão de confirmar em vermelho: vermelho passou a significar falha.
