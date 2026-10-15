# Sabatina de documentos-versoes (2026-10-15)

Decisões da sabatina (`grill-with-docs`), para o `to-spec`. Os termos estão no `CONTEXT.md` (seção Documentos); as decisões de maior peso, nos ADRs 0005 a 0008.

## Modelo

- A **versão** é do processo, com número sequencial por processo, e guarda os arquivos: .bpmn e .png obrigatórios, .bpm do Bizagi opcional, relatório (.docx ou .pdf) junto ou depois. "Piloto" e "técnico" não são tipos; a versão registra a etapa atual do processo no envio (ADR 0005).
- E-mails do setor (.eml) ficam para a funcionalidade 6; o tipo "outro" fica fora.
- Enviar uma versão não muda nenhuma etapa (ADR 0006).
- Observação da mudança: opcional.
- Subprocesso tem as próprias versões; na reclassificação, as versões ficam com o item.

## Arquivos

- Formatos: .bpmn, .png, .bpm, .docx, .pdf. Até 20 MB por arquivo.
- Conferência no envio: extensão, tamanho, .png é imagem, .bpmn é XML de BPMN; hash calculado. A checagem completa do .bpmn é da v1.5.
- Download arquivo por arquivo, com o nome padrão (regra 16); sem .zip.
- Converter .bpm em .bpmn: não agora (backlog).

## Relatório

- Pode ser acrescentado a qualquer versão com relatório pendente; a mais recente vem escolhida.
- "Relatório pendente" é calculado (versão nova sem relatório), não gravado. Versão histórica não conta como pendente.
- "Sem alteração de conteúdo": a versão nova recebe o mesmo relatório da anterior, com o nome da versão nova, sem duplicar o arquivo; o histórico registra.

## Substituir arquivo (ADR 0007)

- Qualquer arquivo de qualquer versão nova pode ser substituído por outro do mesmo tipo; o anterior não fica guardado; o histórico registra quem, quando, qual arquivo e o nome e o hash do que saiu.
- Versão histórica nunca. A trava da versão enviada ao setor ou aprovada fica para o planejamento da funcionalidade 6.

## Versões históricas (sufixo F)

- Registradas à mão já nesta funcionalidade (além da importação, na funcionalidade 10): quem registra digita o número (5 → V5F) e envia os arquivos que tiver (basta o .bpm; relatório opcional). Várias são permitidas.
- Só enquanto o processo não tem versão nova; a primeira nova continua a numeração (V5F → V6). Somente leitura.

## Quem pode e quando

- Administrador e Integrante do EP enviam, acrescentam relatório e substituem, sem precisar ser o responsável da etapa. Consulta vê e baixa.
- Só com o processo em andamento; suspenso, cancelado ou concluído só consulta.
- Cada versão enviada, relatório acrescentado, "sem alteração de conteúdo" e substituição gera evento no histórico do processo.
- Processo com versões não pode ser excluído. Trocar o setor e renomear o processo continuam permitidos; os arquivos mantêm o nome da época (regra 18).

## Drive (ADR 0008)

- Nenhum arquivo no Supabase. Arquivos num Drive compartilhado do CED, criado pelo usuário, pasta aberta à equipe.
- Acesso por uma conta de serviço **própria do EP**, no projeto Google Cloud pessoal do usuário, membro do Drive compartilhado; chave só como segredo de uma Edge Function, que confere quem chamou (logado, ativo, perfil) antes de agir. Referência que já funciona: `supabase/functions/drive-upload` e `src/lib/evidenciaDrive.js` do Projeto Diagnóstico de Maturidade ESG (envio em sessão resumível, bytes do navegador direto ao Google; download pela função, aberto como blob).
- Quem pode ver, enviar e substituir é decidido pela RLS, não pela participação no Drive. A Consulta não precisa ser membro do Drive.
- Pastas: `<Drive> / <SIGLA> / <Nome do processo> / <nome padrão do arquivo>`; subprocesso numa pasta própria dentro da pasta do setor dele; renomear o processo ou trocar a sigla renomeia ou move a pasta, e os arquivos mantêm o nome.
- Desenvolvimento e produção em Drives (ou pastas raiz) separados, cada identificador como segredo do projeto Supabase correspondente.
- A plataforma compara o hash guardado com o do Drive e mostra "alterado fora da plataforma" ou "não encontrado no Drive".
- Permissões no Drive, mantidas pelo usuário: Integrantes como Colaborador (conferir no Google que não apaga), o usuário como Administrador.
- Envio em dois tempos: a versão só é registrada depois que todos os arquivos dela chegaram ao Drive; se algo falhar, nada é registrado, a plataforma avisa, e os arquivos que subiram ficam órfãos na pasta. A função não apaga arquivos.
- Primeiro ticket: a função e o caminho de envio e download (prova técnica), antes das telas.
