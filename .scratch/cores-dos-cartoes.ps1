Add-Type -AssemblyName System.Drawing
$tons = @(
'coral claro|F8C4C4','água claro|C4F8ED','rosa claro|F8C4D9','menta claro|C4F8D9','orquídea claro|F8C4ED','verde claro|C4F8C4',
'lilás claro|EDC4F8','pistache claro|D9F8C4','lavanda claro|D9C4F8','limão claro|EDF8C4','pervinca claro|C4C4F8','areia claro|F8EDC4',
'azul claro|C4D9F8','pêssego claro|F8D9C4','céu claro|C4EDF8','limão médio|DAE7A6','pervinca médio|A6A6E7','areia médio|E7DAA6',
'azul médio|A6C0E7','pêssego médio|E7C0A6','céu médio|A6DAE7','coral médio|E7A6A6','água médio|A6E7DA','rosa médio|E7A6C0',
'menta médio|A6E7C0','orquídea médio|E7A6DA','verde médio|A6E7A6','lilás médio|DAA6E7','pistache médio|C0E7A6','lavanda médio|C0A6E7')
function Cor($hex, $f) {
  $c = 1,3,5 | ForEach-Object { [math]::Min(255, [int][math]::Round([Convert]::ToInt32($hex.Substring($_ - 1, 2), 16) * $f)) }
  [System.Drawing.Color]::FromArgb($c[0], $c[1], $c[2])
}
$cols = 6; $w = 220; $h = 155; $m = 16
$bmp = New-Object System.Drawing.Bitmap ($cols * ($w + $m) + $m), (5 * ($h + $m) + $m)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.TextRenderingHint = 'AntiAliasGridFit'
$fonte = New-Object System.Drawing.Font 'Segoe UI', 10
$texto = [System.Drawing.Brushes]::Black
for ($i = 0; $i -lt 30; $i++) {
  $nome, $hex = $tons[$i].Split('|')
  $x = $m + ($i % $cols) * ($w + $m); $y = $m + [math]::Floor($i / $cols) * ($h + $m)
  $claro = Cor $hex 1; $escuro = Cor $hex 0.88
  $g.FillRectangle((New-Object System.Drawing.SolidBrush $claro), $x, $y, $w, 55)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush $escuro), $x, ($y + 55), $w, 55)
  $g.DrawString("$($i + 1). $nome", $fonte, $texto, $x, ($y + 112))
  $hexEscuro = '{0:X2}{1:X2}{2:X2}' -f $escuro.R, $escuro.G, $escuro.B
  $g.DrawString("#$hex  /  #$hexEscuro", $fonte, $texto, $x, ($y + 130))
}
$bmp.Save("$PSScriptRoot\cores-dos-cartoes.png", [System.Drawing.Imaging.ImageFormat]::Png)
