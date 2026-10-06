# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipe interna do Escritório de Processos (EP) do Centro Estadual de Desburocratização (CED): 6 pessoas hoje, até 10. Usam a plataforma o dia todo, em monitor de computador, para atualizar etapas, enviar versões de fluxogramas e relatórios, registrar reuniões e revisões e consultar o painel. Três perfis: Administrador, Integrante do EP e Consulta. Acesso dos responsáveis dos setores fica para depois (backlog).

## Product Purpose

Controlar o trabalho do EP processo a processo: acompanhar cada processo etapa por etapa (da identificação dos responsáveis até a aprovação com E-protocolo), guardar fluxogramas (.bpmn + .png) e relatórios com versões que nunca se apagam, registrar reuniões, revisões e o histórico de toda alteração, e substituir o dashboard atual em Power BI por um painel próprio. Sucesso: o andamento deixa de ficar espalhado entre planilhas, arquivos e Power BI, com versão, histórico e prazo visíveis num lugar só.

## Positioning

Ferramenta interna feita para o ciclo de mapeamento de processos do EP (sensibilização, modelagem, revisão interna, rodadas com o setor, aprovação), com catálogo de etapas configurável e versões imutáveis de documentos.

## Operating Context

- Uso interno, em desktop; layout para celular é opcional.
- Documentos do trabalho: fluxogramas BPMN (.bpmn, .png, .bpm do Bizagi), relatórios (.docx, .pdf) e e-mails trocados com os setores (.eml).
- Padrão de nome de arquivo SIGLA_VERSÃO_NOME identifica setor, versão e processo.
- E-protocolo: só registro do número e do link.
- Detalhe completo em `.scratch/especificacao.md` e `.scratch/projeto.md`.

## Capabilities and Constraints

- Telas da v1: login, lista de processos com filtros, detalhe do processo (linha do tempo, documentos e versões, visualizador BPMN, revisões, histórico), setor, reuniões, dashboard, administração e importação.
- Revisor interno precisa ser diferente de quem enviou o documento.
- Versões de arquivo nunca se apagam; toda alteração fica no histórico.
- Dados pessoais de servidores: LGPD se aplica; segurança por perfil no banco.
- Stack: Vite + React + TypeScript, Supabase (região São Paulo).
- Interface em português do Brasil.

## Brand Commitments

Nenhuma exigência de identidade visual institucional (CED ou Governo do Estado) confirmada em 2026-10-06. A identidade fica livre para a etapa de concepção.

## Evidence on Hand

Nenhum dado real no projeto: exemplos, testes e seed usam só dados inventados. Não inventar números, setores ou pessoas reais em telas de demonstração.

## Product Principles

1. Andamento visível de relance: etapa, prazo e pendência de cada processo sem precisar abrir arquivos.
2. Nada se perde: versões e histórico são permanentes e rastreáveis.
3. Densidade de ferramenta de trabalho diário: rápido de varrer e de atualizar, sem passos supérfluos.
4. Manutenível por outra equipe: soluções simples e documentadas.

## Accessibility & Inclusion

WCAG 2.2 nível AA: contraste adequado, uso completo pelo teclado e compatibilidade com leitor de tela.
