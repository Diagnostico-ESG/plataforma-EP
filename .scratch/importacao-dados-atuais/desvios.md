# Desvios de importacao-dados-atuais

## 2026-11-05 (ticket 01)

- **Macroprocesso é global.** A spec fala em "A definir" criado "com os setores que aparecerem nele" e em reaproveitar o macroprocesso "no setor". No banco o macroprocesso não pertence a um setor (o vínculo é `setores_envolvidos`, criado pelo gatilho do processo). A importação reaproveita o macroprocesso pelo nome (sem diferença de caixa) em toda a plataforma e o vínculo com o setor nasce sozinho. Efeito: "A definir" é um único macroprocesso, ligado a todos os setores que tiverem processo nele.
- **Data da modelagem piloto.** A spec só diz que a data em Não iniciados é ignorada. Valem também, com aviso: data ilegível ou no futuro (o banco recusa data futura da modelagem piloto). A data só é gravada quando o piloto foi feito.
- **Aba só com o módulo ligado.** A prop `importacao` do `App` e de `AreaDeAdministracao` é opcional (a aba some sem ela), para não mexer nos 53 arquivos de teste que já montam o `App`; o `main.tsx` sempre a passa.
- **Falha no meio da carga.** A tela para na primeira falha e diz quantos entraram e quantos ficaram sem tentar; o texto manda escolher o arquivo de novo (o que já entrou é pulado).
- **Testes de banco pelo GitHub Actions**, não pelo Docker local (fechado nesta sessão).
