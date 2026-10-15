# Arquivos no Drive compartilhado do CED, por uma conta de serviço

Data: 2026-10-15.

A especificação guardava os arquivos no Supabase Storage na v1 e copiava as versões aprovadas para o Drive na v1.5. Decisão do usuário: o Drive é essencial e institucional, e o Supabase não guarda nenhum arquivo. Os arquivos das versões ficam num Drive compartilhado do CED, criado pelo usuário, numa estrutura de pastas aberta à equipe; o banco guarda só os dados de cada arquivo (nome, formato, tamanho, hash e o identificador no Drive).

A plataforma entra no Drive por uma conta de serviço do projeto do Google Cloud pessoal e provisório do usuário (o mesmo do login), membro do Drive compartilhado, como na plataforma do Diagnóstico de Maturidade ESG, onde o arranjo já funciona no Drive do CED. A chave da conta de serviço vive só numa Edge Function, que confere quem chamou (logado, ativo, com o perfil exigido) antes de agir. No envio, a função abre uma sessão de envio no Drive e os bytes vão do navegador direto ao Google; no download, a função lê o arquivo e o devolve à plataforma. Quem pode ver, enviar e substituir é decidido pela RLS do banco, não pela participação no Drive. A liberação de um projeto do Google Cloud institucional pela TI fica para depois da v1.

Consequências: a pasta aberta permite trocar ou apagar arquivos sem passar pela plataforma, então a plataforma compara o hash guardado com o do Drive e avisa a diferença; a chave secreta passa a existir no projeto, só como segredo da Edge Function, fora do código e do git.

## Opções consideradas

- Supabase Storage na v1 e cópia ao Drive na v1.5 (a especificação): segurança toda na RLS e sem chave secreta, mas os arquivos ficariam fora do lugar institucional.
- A conta Google de cada pessoa, sem chave secreta: o escopo de acesso total do Drive é restrito pelo Google (verificação com avaliação de segurança), e o escopo limitado não garante que uma pessoa enxergue o arquivo enviado por outra; além disso, toda pessoa, inclusive a Consulta, precisaria ser membro do Drive compartilhado.
