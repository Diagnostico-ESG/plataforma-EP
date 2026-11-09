// Os testes de banco novos terminam com uma exceção "RESULTADO DOS TESTES" que traz as linhas do pgTAP,
// porque o SQL Editor do painel só mostra o último resultado (e a exceção desfaz tudo o que o teste criou).
const MARCADOR = 'RESULTADO DOS TESTES'

export function linhasDoRelatorio(mensagem) {
  if (!mensagem.startsWith(MARCADOR)) return null
  return mensagem.slice(MARCADOR.length).split('\n').map((l) => l.trim()).filter(Boolean)
}
