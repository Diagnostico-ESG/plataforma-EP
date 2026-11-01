/** O tamanho do arquivo como se lê na lista do verso: "512 B", "48 KB", "1,2 MB". */
export function tamanhoDoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
