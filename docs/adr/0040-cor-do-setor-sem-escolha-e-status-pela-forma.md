# Cor do setor sem escolha e Status distinguido pela forma

Data: 2026-11-03.

Decisão do usuário (revisão de `setor-neutro-e-fotos`, planejada no `/planejar` modo curto). Substitui o ponto do ADR 0039 sobre setor sem cor própria e Status colorido; o resto do 0039 (sigla maior, selo no cartão do Quadro por setor, o nome Status, pílulas de Situação, foto do responsável) continua valendo.

O selo do setor volta a ter cor própria: as 12 cores fortes da tabela de antes (sigla em branco, acima de 4,5:1), em ciclo sobre o número 1 a 30 da coluna `cor` de `setores`, que o gatilho do banco preenche no setor novo. A tela só lê esse número; não há escolha de cor no cadastro, nem grade de cores, nem fundo tingido na coluna. A cor vale em todo selo, inclusive nos cabeçalhos do Quadro por setor e das Linhas por setor, e no quadradinho das opções de setor nas caixas de seleção. Os três ícones de Status passam à cor do texto (`--texto`, `#1d2330`) e se distinguem só pela forma: círculo vazio, meio cheio e cheio com visto.

O motivo: visto o resultado, o selo neutro igual para todos os setores ficou sem graça; e, com o setor colorido de novo, três cores no Status competiriam com ele no cartão.

## Opções consideradas

- **Devolver a escolha de cor no cadastro:** dá controle, mas traz de volta a grade e a regra "primeira cor livre"; o número que o banco já dá basta.
- **Selo neutro nos cabeçalhos do Quadro:** a cor não ajudaria a ligar o cabeçalho ao cartão; o mesmo selo vale em todo lugar.
- **Opção da caixa de seleção sem o quadradinho:** contraria a regra das caixas de seleção (a opção mostra o seu visual real).
- **Status em preto puro ou cinza-escuro:** o preto destoa do texto, e o cinza mais suave apaga o meio cheio do Iniciado; ficou o tom do texto.
