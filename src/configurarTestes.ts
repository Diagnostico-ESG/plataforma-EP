import { configure } from '@testing-library/react'

// Padrão de 1 s do findBy/waitFor estourava com a máquina ocupada (bateria cheia, outra sessão): a tabela ainda carregando. O limite do teste inteiro (testTimeout) é 15 s.
configure({ asyncUtilTimeout: 5000 })

// O jsdom não implementa showModal/close de <dialog>; este é o mínimo para os testes de interface.
// O teste do hook em .claude/hooks roda em Node puro, sem DOM: nele não há nada a preparar.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  // Esc no navegador: a janela de cima recebe "cancel", que pode ser impedido; se não for, ela fecha.
  // Quem trata o Esc antes (um menu aberto) impede a ação padrão, e a janela fica.
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape' || evento.defaultPrevented) return
    const abertas = document.querySelectorAll<HTMLDialogElement>('dialog[open]')
    const deCima = abertas[abertas.length - 1]
    if (deCima && deCima.dispatchEvent(new Event('cancel', { cancelable: true }))) deCima.close()
  })
}
