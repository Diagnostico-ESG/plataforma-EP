# O banco agenda a atualização das planilhas e entrega os dados à função, sem chave secreta

Data: 2026-10-20.

A atualização das planilhas dos dashboards (ADR 0017) roda todo dia às 6h de Brasília, sem ninguém logado, e a função `arquivos-no-drive` lê o banco com o login de quem a chamou (ADR 0008). Decisão do usuário: o próprio banco agenda a atualização (pg_cron), monta o pacote de dados com uma função em schema não exposto e o envia à Edge Function (pg_net), com uma senha interna guardada no cofre do banco (Vault) e cadastrada também como segredo da função. O botão "Atualizar planilhas agora" segue o mesmo caminho: o Administrador pede ao banco, que confere o perfil, registra a tentativa e envia o pacote. A função só confere a senha e o formato do pacote, monta as linhas e escreve as planilhas com a conta de serviço do Drive; ela nunca lê o banco. No fim, devolve o resultado ao banco por uma função pública que só aceita a ficha de uso único daquela tentativa.

Assim a chave secreta do Supabase continua fora da plataforma, a trava "já há uma atualização em andamento" fica no banco, e um caminho só serve à atualização automática e ao botão. Os endereços das duas planilhas, o endereço da função e a senha ficam no cofre do banco, um ponto único por ambiente, gravado pelo usuário no SQL Editor.

## Opções consideradas

- A função lê os dados com a chave secreta do Supabase na atualização automática: código mais simples, mas a chave secreta leria o banco inteiro, ignorando a RLS.
- Um usuário-robô logado por um agendamento do GitHub Actions: o login é só pelo Google institucional (ADR 0001), e o agendamento do GitHub atrasa e se desliga depois de 60 dias sem atividade no repositório.
