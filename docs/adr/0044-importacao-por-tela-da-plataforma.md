# 0044 — Importação dos dados atuais por uma tela da plataforma

Data: 2026-11-05. Estado: aceito.

**Contexto.** A importação saiu da v1 em 2026-10-20, porque os dados atuais não seguiam a organização da plataforma. Com a produção no ar (2026-11-05), o usuário pediu a importação de volta, em duas entregas conferidas uma a uma: os cadastros e a etapa de cada processo, a partir da aba PRODUTO 33 da planilha Controle de Mapeamentos, e depois os arquivos das versões, a partir da pasta local DOCUMENTOS MAPEAMENTO. O protocolo prevê um script local que entra com e-mail e senha de administrador. A produção, porém, só tem login pelo Google (ADR 0001, Email desligado). A rede do escritório só abre a porta 443, e os arquivos das versões não podem passar pelo GitHub.

**Decisão.**
1. As duas entregas são feitas por uma tela **Administração → Importação**, só para o Administrador, com o login Google dele. A tela mostra uma prévia e grava pelas regras do banco, como qualquer cadastro. Os arquivos vão do computador do usuário para o Drive pela função `arquivos-no-drive`. A tela continua na plataforma depois da carga.
2. Só na importação, as travas de etapa do envio de versões ficam de lado: a histórica fora de Não iniciados, a piloto fora da Modelagem piloto e a versão em sequência fora das suas etapas. Continuam valendo o número único por processo e o .bpm obrigatório.

**Alternativas descartadas.** Um script com e-mail e senha obrigaria a ligar o login por e-mail na produção. Um workflow do GitHub Actions gravaria com a conexão de administrador do banco, por fora das regras por perfil e sem "quem importou", e não serve para os arquivos.

**Consequência.** O que já existe na plataforma nunca é alterado pela importação: o que se repete é pulado e listado. O processo importado tem um único registro no histórico ("importado da planilha"). Regras de etapa e casos fora da regra estão em `.scratch/importacao-dados-atuais/amostra/cabecalho.md` e `sabatina.md`.
