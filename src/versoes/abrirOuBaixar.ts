// Entrega do arquivo baixado ao usuário. A aba nova só faz sentido para o que o navegador mostra (.png, .pdf);
// os outros formatos vão direto para download, com o nome padrão (uma aba para um .bpmn ficaria vazia).
const FORMATOS_QUE_ABREM = ['png', 'pdf']
// Tempo para a aba ou o download terminarem de ler o endereço antes de ele ser liberado.
const ATRASO_DA_REVOGACAO_EM_MS = 60_000

/** Chamada dentro do clique, antes de esperar a rede: é isso que impede o navegador de bloquear a aba. */
export function abrirAba(formato: string): Window | null {
  return FORMATOS_QUE_ABREM.includes(formato) ? window.open('', '_blank') : null
}

export function fecharAba(aba: Window | null): void {
  aba?.close()
}

function baixarComNome(endereco: string, nome: string): void {
  const ancora = document.createElement('a')
  ancora.href = endereco
  ancora.download = nome
  document.body.append(ancora)
  ancora.click()
  ancora.remove()
}

/** Com aba, ela vai ao arquivo; sem aba (formato que não abre, ou aba bloqueada), o arquivo é baixado. */
export function entregarArquivo(aba: Window | null, arquivo: Blob, nome: string): void {
  const endereco = URL.createObjectURL(arquivo)
  if (aba) aba.location.href = endereco
  else baixarComNome(endereco, nome)
  setTimeout(() => URL.revokeObjectURL(endereco), ATRASO_DA_REVOGACAO_EM_MS)
}
