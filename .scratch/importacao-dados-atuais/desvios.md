# Desvios de importacao-dados-atuais

## 2026-11-05 (ticket 01)

- **Macroprocesso é global.** A spec fala em "A definir" criado "com os setores que aparecerem nele" e em reaproveitar o macroprocesso "no setor". No banco o macroprocesso não pertence a um setor (o vínculo é `setores_envolvidos`, criado pelo gatilho do processo). A importação reaproveita o macroprocesso pelo nome (sem diferença de caixa) em toda a plataforma e o vínculo com o setor nasce sozinho. Efeito: "A definir" é um único macroprocesso, ligado a todos os setores que tiverem processo nele.
- **Data da modelagem piloto.** A spec só diz que a data em Não iniciados é ignorada. Valem também, com aviso: data ilegível ou no futuro (o banco recusa data futura da modelagem piloto). A data só é gravada quando o piloto foi feito.
- **Aba só com o módulo ligado.** A prop `importacao` do `App` e de `AreaDeAdministracao` é opcional (a aba some sem ela), para não mexer nos 53 arquivos de teste que já montam o `App`; o `main.tsx` sempre a passa.
- **Falha no meio da carga.** A tela para na primeira falha e diz quantos entraram e quantos ficaram sem tentar; o texto manda escolher o arquivo de novo (o que já entrou é pulado).
- **Testes de banco pelo GitHub Actions**, não pelo Docker local (fechado nesta sessão).

## 2026-11-06 (ajuste de 2026-11-06 e /ship da primeira entrega)

- **`/polir` pulado** por decisão do usuário: o ajuste só mudou o texto dos avisos da prévia.
- **Corrigido na revisão do `/ship`** (caminho de bug, teste vermelho antes): o aviso de linha repetida mostrava o nome do processo em minúsculas e agora mostra como está na planilha; a falha ao ler o que já existe na plataforma jogava fora o motivo e agora o mostra na frase; a chave da linha repetida passou a usar `chaveDoProcesso`, a mesma da prévia e do banco.
- **Escopo a mais, aceito:** as Observações acima de 8000 caracteres são cortadas, com aviso; a linha sem Área ou sem nome é ignorada, com aviso; o leitor, o .csv, o falso e o contrato real têm testes próprios, além dos testes pela tela (a spec previa só os da tela; o `CLAUDE.md` pede teste para toda função nova).
- **Regra antiga ainda aceita no banco:** `importar_processo` ainda aceita a etapa `publicacao` sem data, e o teste `74_importar_processo` prova esse caso. Isso não causa dano, porque o leitor não envia mais esse caso desde o ajuste. Fica como está, porque o banco não muda neste ajuste.
- **O que ficou para depois** está no `.scratch/backlog.md` (linha de 2026-11-06): o resumo sem a contagem de setores e macroprocessos, a mensagem do banco sem o valor e os testes que faltam.
- **Revisão de segurança: só a de reserva.** O usuário pediu para concluir sem rodar o `/security-review`. Na revisão de reserva das mudanças desde `marco/2026-11-05-inicio-importacao-dados-atuais`, não houve achado: a função do banco confere o Administrador ativo antes de gravar qualquer coisa, e o teste `74` cobre cada perfil, o usuário desativado e o visitante; a função com poder ampliado fica na área protegida do banco (schema `private`, com `search_path` vazio); a tela mostra o conteúdo da planilha só como texto, sem montar HTML com ele. Observação: o .csv não tem limite de tamanho, mas um arquivo enorme trava só o navegador de quem o escolheu.
