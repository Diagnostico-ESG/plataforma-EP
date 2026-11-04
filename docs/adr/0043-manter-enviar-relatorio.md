# 0043 — Manter o [Enviar relatório] (adia o item 7 do ADR 0042)

Data: 2026-11-04. Estado: aceito.

**Contexto.** O ADR 0042 decidiu tirar o botão [Enviar relatório] das etapas Relatório e modelagem técnica e Revisão interna, no pressuposto de que o relatório continuaria entrando pelo formulário da versão ou pelo "+ Acrescentar relatório" da versão. Na execução, viu-se que o "+ Acrescentar relatório" saiu no ticket 10 de `documentos-versoes` (relatório com numeração própria): hoje o único caminho para mandar ou refazer um relatório sem criar versão nova é o [Enviar relatório].

**Decisão.** Manter o [Enviar relatório] por ora, a pedido do usuário. O resto do ADR 0042 vale. O botão de envio de versão já diz "Enviar versão" nessas etapas e "Enviar versão piloto" na Modelagem piloto.

**Consequência.** Os critérios 5 e 6 da spec de `enxugar-quadro-e-verso` ficam como "não aplicáveis". Para tirar o botão no futuro, criar antes o espaço "+ Acrescentar relatório" na versão mais recente (abrindo o `FormularioDeRelatorio`) e religar a Confirmação de arquivos a ele; registrado no backlog.
