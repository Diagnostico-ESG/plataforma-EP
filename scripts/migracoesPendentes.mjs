// Ensaio automático das migrações ainda não aplicadas no banco de desenvolvimento (escolha de 2026-10-24,
// processos-etapas 24): a branch testa a migração nova dentro da transação de cada teste, que se desfaz no fim,
// sem mudar o banco. Pendente é a migração com versão maior que a última registrada; as mais antigas,
// aplicadas à mão sem registro, ficam de fora.
const FORMATO = /^(\d{14})_[a-z0-9_]+\.sql$/
// O teste da conversão monta os dados no modelo antigo e marca onde as migrações entram.
export const MARCA_DO_PONTO = '-- ensaio: migrações pendentes aqui'

export function migracoesPendentes(arquivos, ultimaAplicada) {
  if (!ultimaAplicada) {
    // Sem registro, "pendente" seria tudo, e rodar todas as migrações por cima do banco o quebraria.
    throw new Error(`O banco não tem migração registrada. Esperado: uma versão AAAAMMDDHHMMSS. Recebido: ${ultimaAplicada}.`)
  }
  return arquivos
    .filter((nome) => FORMATO.test(nome) && nome.slice(0, 14) > ultimaAplicada)
    .sort()
}

// Sem marca, as migrações vão antes do teste: o "begin" do próprio teste vira só um aviso, e o erro do fim do teste
// desfaz também as migrações. Com a marca, entram no ponto dela, já dentro da transação do teste.
export function comEnsaio(sqlDoTeste, sqlDasPendentes) {
  if (sqlDoTeste.includes(MARCA_DO_PONTO)) return sqlDoTeste.replace(MARCA_DO_PONTO, () => sqlDasPendentes.join('\n'))
  if (sqlDasPendentes.length === 0) return sqlDoTeste
  return ['begin;', ...sqlDasPendentes, sqlDoTeste].join('\n')
}
