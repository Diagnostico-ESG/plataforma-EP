# Miniatura guardada na memória e pasta conferida lembrada na função

Data: 2026-11-03.

Decisão do usuário (funcionalidade 19, `miniatura-rapida`, mudança em `processos-etapas`). Revê duas frases da spec do redesenho: "Nada é guardado" (miniatura) e "sem mudança na função" (a miniatura usa a ação de baixar como ela já é).

As miniaturas do verso levavam de 4 a 5 s, e reabrir o mesmo processo levava o mesmo tempo. Medição no desenvolvimento (aba Rede): as chamadas pequenas da função levam 1,5 a 1,7 s (custo fixo), e o pedido do .png (407 kB) cerca de 3 s, ou seja, cerca de 1,4 s acima do mínimo, vindos da conferência das pastas até a raiz e do download. O tamanho do arquivo não é o problema.

Duas mudanças:

- **App:** o conteúdo da miniatura fica guardado na memória do app, por id de arquivo, até a página ser recarregada. Reabrir não faz novo pedido. Falha não é guardada. O id muda a cada versão enviada, então a cópia nunca fica velha. Só a miniatura guarda; o botão de abrir continua baixando a cada clique.
- **Função `arquivos-no-drive`:** a conferência "debaixo da raiz" lembra, na memória da função, por 5 minutos, as pastas já confirmadas. Só resposta positiva é lembrada. O pai de cada arquivo e a leitura do banco com o login de quem chamou continuam a cada pedido. Efeito aceito: pasta movida para fora da raiz continua valendo por até 5 minutos naquela instância. Exige revisão de segurança no `/ship`.

## Opções consideradas

- **Imagem reduzida do Drive (`thumbnailLink`), com o .png como reserva:** ajuda pouco, porque o arquivo já é pequeno e o custo está no caminho da função.
- **Só guardar no app:** não toca na função, mas a primeira abertura continua em cerca de 3 s.
- **Lembrar também a permissão do chamador:** economizaria mais, mas guardaria uma decisão de acesso; fica fora.
