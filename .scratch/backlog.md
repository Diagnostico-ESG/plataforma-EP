# Backlog

Uma linha por item: o que é e onde surgiu.

## Decisões abertas da especificação (origem: .scratch/especificacao.md, seção 11)

- Decisão aberta: plano do Supabase (backup diário) e onde o front-end será hospedado. (especificação, item 11.1)
- Decisão aberta: validação do uso de nuvem externa pelo jurídico e pela TI (contrato e LGPD). (especificação, item 11.2)
- ~~Decisão aberta: login por e-mail e senha no Supabase Auth ou integração com acesso do governo, se existir.~~ Resolvida em 2026-10-07: conta Google institucional, liberada por autorização (ADR 0001). (especificação, item 11.3)
- Decisão aberta: a cópia dos arquivos para o Drive institucional entra na v1.5? (especificação, item 11.4)
- Decisão aberta: publicação só interna ou também no site da Casa Civil. (especificação, item 11.5)
- Decisão aberta: formato e origem dos dados atuais para importação (planilha, base do Power BI). (especificação, item 11.6)
- Decisão aberta: lista de macroprocessos parte da Cadeia de Valor da Casa Civil ou é criada pelo EP; a categoria (finalístico, apoio, gerencial) será usada? (especificação, item 11.7)
- Decisão aberta: arquivo-fonte do Bizagi (.bpm) obrigatório, opcional ou não guardado. (especificação, item 11.8)
- ~~Decisão aberta: o fluxograma piloto entra na numeração de versões (V1) ou fica fora.~~ Resolvida em 2026-10-07: entra (piloto V6, técnica V7). (especificação, item 11.9)
- ~~Decisão aberta: responsável pelas etapas 7 e 8 e se elas são capturadas como a revisão interna.~~ Resolvida em 2026-10-07: as duas são capturadas. (especificação, item 11.11)
- Configuração do administrador: para cada etapa, escolher entre "capturada por qualquer integrante" e "sempre atribuída a um usuário fixo" (todos os processos que chegam nela vão para essa pessoa). (conversa de 2026-10-07 sobre o fluxo das etapas 4 a 8)
- Revisão interna com opção de devolver ao autor para corrigir (hoje o revisor sempre corrige direto). (conversa de 2026-10-07 sobre o fluxo das etapas 4 a 7)
- ~~Decisão aberta: quem mantém o sistema depois de pronto.~~ Resolvida no /projeto em 2026-10-06: a manutenção pode passar à TI do CED ou a outra equipe; documentar para isso. (especificação, item 11.10)
- Migrar o cliente OAuth do Google da conta pessoal (provisória) para um projeto do Google Cloud na conta institucional, quando a TI liberar; passos em `docs/implantacao-login.md`. Antes da produção, se possível. (login-perfis, ticket 01, 2026-10-07)

## Versões posteriores da especificação

- EP v1.5: alertas por e-mail (prazo vencendo, revisão pendente, setor sem resposta). (especificação, seção 1)
- EP v1.5: checagem automática do .bpmn no upload (RegraBpmn, ChecagemBpmn). (especificação, seção 1)
- EP v1.5: publicação interna e/ou externa, conforme a decisão sobre o destino. (especificação, seção 1)
- EP v1.5: sincronização com o Google Drive institucional (Edge Function copia versões aprovadas). (especificação, seções 1 e 7)
- EP v2: comparação visual entre versões do fluxograma. (especificação, seção 1)
- EP v2: problemas e oportunidades identificados na reunião, ligados ao processo (Apontamento). (especificação, seção 1)
- EP v2: registro do uso da IA (versão do prompt, entrada e saída). (especificação, seção 1)
- EP v2: formulário estruturado na reunião que gera o rascunho do relatório. (especificação, seção 1)
- EP v2: chamada ao Gemini de dentro da plataforma (depende de liberação para enviar conteúdo a serviço externo). (especificação, seção 1)
- EP v2: previsão de conclusão por ritmo de trabalho. (especificação, seção 1)
- EP depois: fase 2 (TO-BE), com etapas novas no catálogo configurável. (especificação, seção 1)
- EP depois: mais de um nível de subprocesso. (especificação, seção 1)
- EP depois: integração com caixa de e-mail compartilhada do setor. (especificação, seção 7)
- EP depois: acesso dos responsáveis dos setores à plataforma (hoje só os 6 integrantes do EP usam). (/projeto, 2026-10-06)
- EP depois: registrar quem consultou cada dado (abrir processo, baixar arquivo), se jurídico/TI exigirem; v1 registra só alterações. (/projeto, 2026-10-06)
- Pedir à TI a liberação de saída para `*.pooler.supabase.com` nas portas 5432 e 6543 (necessária para publicar em produção; hoje migrações e testes de banco vão à mão pelo SQL Editor). Surgiu no `/setup`, 2026-10-06.
- EP depois (ajustado na sabatina de login-perfis, 2026-10-07: a v1 mostra a foto da conta Google, sem envio): envio de foto própria do usuário no perfil, com iniciais quando não houver foto. Foto é dado pessoal (LGPD): bucket privado, URL assinada, envio opcional pelo próprio usuário ou pelo administrador, remoção possível. Responsáveis dos setores (não usuários) só com iniciais. Surgiu na `/concepcao-livre`, 2026-10-07.
- EP v1 (Login e perfis): trocar o ícone "Sua conta" da barra superior pelo avatar do usuário logado (foto ou iniciais; componente `Avatar` já existe). Sem login não há usuário a mostrar, e o projeto não inventa pessoas. Surgiu no `/implementar-identidade`, 2026-10-07. Entra na spec de login-perfis (sabatina de 2026-10-07).
- EP depois: como atender a um pedido de eliminação de dados pela LGPD de quem já foi usuário (por exemplo, trocar nome e e-mail por "Usuário removido" no histórico), depois de o jurídico dizer se o registro de quem fez o quê precisa ser mantido. Surgiu na sabatina de login-perfis, 2026-10-07 (ADR 0002).
- EP depois: integrar um login do governo como provedor adicional, se um dia existir e for útil. Surgiu na sabatina de login-perfis, 2026-10-07 (ADR 0001).
