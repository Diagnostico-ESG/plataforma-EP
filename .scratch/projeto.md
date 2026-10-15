# Plataforma do Escritório de Processos (EP)

Plataforma web interna do Centro Estadual de Desburocratização (CED) para controlar o trabalho do Escritório de Processos. Ela acompanha cada processo etapa por etapa (da identificação dos responsáveis até a aprovação com E-protocolo), guarda fluxogramas (.bpmn + .png) e relatórios com versões que nunca se apagam, registra reuniões, revisões e o histórico de tudo, e substitui o dashboard atual em Power BI por um painel próprio. O detalhe (modelo de dados, regras de negócio, telas) está em `.scratch/especificacao.md` e vai virar o `CONTEXT.md` na sabatina do `/planejar` da primeira funcionalidade.

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
2. **Cadastros básicos** (cadastros-basicos)**:** setores (sigla e responsável), macroprocessos e os setores de cada macroprocesso.
3. **Processos e etapas** (processos-etapas)**:** processos e subprocessos, catálogo de etapas configurável, andamento com dispensa e "realizada anteriormente", reclassificação e o histórico de alterações (que as funcionalidades seguintes também alimentam).
4. **Reuniões** (reunioes)**:** de sensibilização e de modelagem, com data, local, participantes e anotações.
5. **Documentos e versões:** envio de fluxogramas e relatórios, numeração de versões, versões históricas (sufixo F) e o padrão de nome dos arquivos.
6. **Revisões e aprovação:** revisão interna (o revisor precisa ser diferente de quem enviou), rodadas de revisão pelo setor com os e-mails e aprovação com o número do E-protocolo.
7. **Visualizador de fluxograma:** abre o .bpmn no navegador, no detalhe do processo.
8. **Prazos:** prazo por etapa e indicador de atraso.
9. **Dashboard:** os indicadores da seção 6 da especificação.
10. **Importação:** carga inicial com validação antes de gravar e uma lista de pendências.
11. **Exportação em CSV e documentação de manutenção.**

As versões v1.5, v2 e "depois" da especificação estão no `.scratch/backlog.md`.
