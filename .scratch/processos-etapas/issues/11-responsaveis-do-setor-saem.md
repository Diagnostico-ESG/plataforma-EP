# 11: Responsáveis do setor saem

**Como resolve a sua parte.** A identificação dos responsáveis já foi feita para todos os setores, fora da plataforma, e manter a lista na plataforma era trabalho sem uso (e dado pessoal guardado sem necessidade). Este ticket tira os responsáveis do setor da tela do setor e do banco, e deixa os registros antigos no histórico numa linha simples.

**What to build:** a tela do setor sem a seção "Responsáveis do setor"; o módulo de processos sem as operações de responsáveis; a tabela e os gatilhos dela apagados por migração nova; os eventos antigos de responsável do setor no histórico como "Registro de responsável do setor (recurso retirado da plataforma)". Spec: `.scratch/processos-etapas/spec.md` (histórias 45 e 46; "Interface"; "Migração de 2026-10-18", passo 2). Porquê: ADR 0013.

**Blocked by:** reunioes/05 (Data da reunião no processo), porque os participantes das reuniões apontam para os responsáveis do setor.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: migração nova apaga `responsaveis_do_setor`, os gatilhos e funções dela; eventos antigos de `responsavel_do_setor` continuam legíveis por todo perfil ativo e ilegíveis por inativo e visitante.
- [ ] Banco (pgTAP, antes da migração): a tabela não existe; os eventos antigos legíveis como acima. O teste 16 apagado; os testes que criavam responsáveis (11, 13 e outros) conferidos; `00_rls_ligada` e `10_privilegios_padrao` verdes.
- [ ] Tela do setor sem a seção "Responsáveis do setor", sem "Carregando responsáveis…" e sem as mensagens e a janela de excluir responsável.
- [ ] Histórico geral e da área Setores: eventos antigos de responsável do setor na linha simples, com data, autor e ação.
- [ ] Módulo de processos (falsa e Supabase) sem as operações de responsáveis; nenhum código morto ligado a eles.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `supabase/AMBIENTES.md` registra a migração.
