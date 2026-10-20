# Plataforma do Escritório de Processos (EP)

Plataforma web interna do Centro Estadual de Desburocratização (CED) para controlar o trabalho do Escritório de Processos. Ela acompanha cada processo etapa por etapa (da identificação dos responsáveis até a aprovação com E-protocolo), guarda fluxogramas (.bpmn + .png) e relatórios com versões que nunca se apagam, registra reuniões, revisões e o histórico de tudo, e, na v1.5, substitui o dashboard atual em Power BI por um painel próprio (na v1, o Power BI continua em uso). O detalhe (modelo de dados, regras de negócio, telas) está em `.scratch/especificacao.md` e vai virar o `CONTEXT.md` na sabatina do `/planejar` da primeira funcionalidade.

- **Problema que resolve:** hoje o andamento fica espalhado entre planilhas, arquivos e o Power BI, sem versão, sem histórico e sem prazo visível.
- **Quem usa:** equipe interna do EP, 6 pessoas hoje (até 10). Uso em computador; layout para celular é opcional. Acesso dos responsáveis dos setores fica no backlog.
- **Duração e manutenção:** tempo indeterminado. A manutenção pode passar à TI do CED ou a outra equipe, então a documentação precisa permitir que outra pessoa assuma o sistema: instalação, publicação, backup e restauração, modelo de dados e decisões.
- **Região dos dados:** Supabase na região de São Paulo (sa-east-1), com um projeto de desenvolvimento e outro de produção. A validação da nuvem externa pelo jurídico e pela TI está no backlog.
- **Dados pessoais:** nomes e e-mails de servidores e dos responsáveis dos setores, além de e-mails trocados com os setores (.eml). A LGPD se aplica.
- **Dados compartilhados:** sim. Toda a equipe vê os mesmos dados, então o projeto usa banco de dados (Supabase).
- **Login e perfis:** e-mail e senha, com cadastro aberto desligado. Os perfis são Administrador, Integrante do EP e Consulta. O administrador (você) cria os usuários pela própria plataforma, por meio de uma Edge Function que confere quem fez o pedido.
- **Registro de consultas:** não está na v1. A plataforma registra só as alterações (quem, quando, o que mudou). Registrar quem consultou cada dado fica no backlog, para o caso de o jurídico ou a TI exigirem.
- **Arquivos enviados:** fluxogramas (.bpmn, .png e, opcionalmente, o .bpm do Bizagi), relatórios (.docx, .pdf) e e-mails (.eml). Ficam num bucket privado, com versões que nunca se apagam.
- **Outros sistemas e importação:** a v1 importa os dados atuais (planilhas ou a base do Power BI; o formato está em aberto no backlog), e os nomes dos arquivos identificam o setor, a versão e o processo. A carga real é feita por você, fora da sessão. O E-protocolo é só registro do número e do link. O Google Drive fica para a v1.5 (backlog).

## Funcionalidades da v1, na ordem de planejamento

1. **Login e perfis** (login-perfis)**:** usuários, os três perfis, criação de contas pela plataforma e segurança por perfil no banco.
2. **Cadastros básicos** (cadastros-basicos)**:** setores (sigla e nome), macroprocessos e os setores de cada macroprocesso.
3. **Processos e etapas** (processos-etapas)**:** processos e subprocessos, catálogo de etapas configurável, andamento com dispensa e "realizada anteriormente", reclassificação e o histórico de alterações (que as funcionalidades seguintes também alimentam).
4. **Reuniões** (reunioes)**:** a reunião da modelagem piloto, marcada no processo só pela data (simplificada na iniciativa experiencia-do-quadro).
5. **Documentos e versões** (documentos-versoes)**:** envio de fluxogramas e relatórios, numeração de versões, versões históricas (sufixo F) e o padrão de nome dos arquivos.
6. **Experiência do quadro** (experiencia-do-quadro)**:** iniciativa grande que simplifica o uso diário (mapa em `.scratch/experiencia-do-quadro/mapa.md`). Partes, nesta ordem; cada uma atualiza a spec da funcionalidade que muda:
   1. **Simplificação** (processos-etapas, reunioes): saem as etapas do setor, a sensibilização, os responsáveis do setor e a área de Reuniões; a primeira etapa vira Modelagem piloto.
   2. **Etapas mais rápidas** (processos-etapas): concluir escolhe o responsável da próxima e já a inicia; Assumir em qualquer etapa.
   3. **Verso do cartão** (processos-etapas): janela central no lugar do painel lateral; Novo processo na mesma janela; Lista com busca.
   4. **Cartão do Quadro** (processos-etapas): progresso, selos, arrastar para concluir, agrupar por responsável e Só os meus.
   5. **Revisões e aprovação** (revisoes-aprovacao)**:** revisão interna (o revisor precisa ser diferente de quem enviou), revisão pelo setor como etapa, sem rodadas (ADR 0012) e aprovação com o número do E-protocolo.
7. **Importação:** carga inicial com validação antes de gravar e uma lista de pendências.
8. **Exportação em CSV e documentação de manutenção.**

O visualizador de .bpmn (era a funcionalidade 7) saiu da v1 por decisão do usuário em 2026-10-20: a versão passa a exigir o .bpm e o .png, e o fluxo se vê pelo .png (ADR 0016; mudança em documentos-versoes; o visualizador está no backlog).

Prazos e Dashboard, previstos na especificação para a v1, passaram para a v1.5 por decisão do usuário em 2026-10-17 (backlog).

As versões v1.5, v2 e "depois" da especificação estão no `.scratch/backlog.md`.
