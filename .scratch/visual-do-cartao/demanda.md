# Visual do cartão e cor dos setores (visual-do-cartao)

Demanda de 2026-10-27, pelo `/demanda`: mudança em funcionalidades já entregues (processos-etapas e cadastros-basicos), confirmada pelo usuário com a cor **gravada no cadastro do setor**. Cada parte atualiza a spec da funcionalidade que muda, no mesmo arquivo, com a linha `Em revisão desde 2026-10-27`.

1. **Barra de etapas com visual premium.** Hoje é "só cinza" (`.scratch/identidade-visual.md`, `BarraDeProgresso`). Três direções para escolher na sabatina, de preferência vendo um protótipo:
   - **A. Segmentos com brilho:** blocos arredondados, os feitos em degradê azul, a atual com anel luminoso suave; "4/8" à direita.
   - **B. Trilho contínuo:** linha fina que se preenche em degradê, com pontinhos nas etapas; a atual é um ponto maior com halo.
   - **C. Passos conectados:** bolinhas ligadas por linha, feitas com ✓ miúdo, a atual cheia em azul (lembra o caminho de etapas do painel).
2. **Etiquetas com cor viva.** Presumida a **Etiqueta** (A fazer, Em andamento, Concluído), por ser a que aparece no cartão; confirmar na sabatina se a pílula de **Situação** também muda. Contraste WCAG AA continua valendo.
3. **Sigla do setor maior, centralizada, no alto do cartão, sobre uma faixa colorida** que ocupa toda a largura superior do cartão, na cor do setor. Muda a frente do cartão decidida no ADR 0029 (no agrupamento por setor a linha do topo hoje some).
4. **Cor própria por setor.** Paleta fixa de 30 cores claras, distinguíveis entre si, com a sigla em texto escuro. Setor novo recebe a primeira cor ainda livre; o administrador pode trocar no formulário do setor. A cor aparece onde a sigla aparece (Quadro, Lista, verso, tela do setor, cadastros). Precisa de migração (coluna da cor em `setores`, preenchimento dos 22 setores existentes). Recusada pelo usuário a cor calculada pelo código do setor, porque repetiria cores (como acontece hoje com `corDoMacroprocesso`).

Muda decisões da identidade ("barra só cinza", "cor só onde há informação"): ADR novo e acréscimo datado em `.scratch/identidade-visual.md`.
