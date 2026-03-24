export const printHtml = (html) => {
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.print()
}