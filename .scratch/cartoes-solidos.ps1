Add-Type -AssemblyName System.Drawing
$tons = @(
'coral claro|F8C4C4','água claro|C4F8ED','rosa claro|F8C4D9','menta claro|C4F8D9','orquídea claro|F8C4ED','verde claro|C4F8C4',
'lilás claro|EDC4F8','pistache claro|D9F8C4','lavanda claro|D9C4F8','limão claro|EDF8C4','pervinca claro|C4C4F8','areia claro|F8EDC4',
'azul claro|C4D9F8','pêssego claro|F8D9C4','céu claro|C4EDF8','limão médio|DAE7A6','pervinca médio|A6A6E7','areia médio|E7DAA6',
'azul médio|A6C0E7','pêssego médio|E7C0A6','céu médio|A6DAE7','coral médio|E7A6A6','água médio|A6E7DA','rosa médio|E7A6C0',
'menta médio|A6E7C0','orquídea médio|E7A6DA','verde médio|A6E7A6','lilás médio|DAA6E7','pistache médio|C0E7A6','lavanda médio|C0A6E7')
function Arredondado($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = 2 * $r
  $p.AddArc($x, $y, $d, $d, 180, 90); $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure(); $p
}
$cols = 5; $w = 250; $h = 120; $m = 18
$bmp = New-Object System.Drawing.Bitmap ($cols * ($w + $m) + $m), (6 * ($h + $m) + $m)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear([System.Drawing.Color]::White)
$negrito = New-Object System.Drawing.Font 'Segoe UI Semibold', 12
$normal = New-Object System.Drawing.Font 'Segoe UI', 10
$texto = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(31, 41, 55))
for ($i = 0; $i -lt 30; $i++) {
  $nome, $hex = $tons[$i].Split('|')
  $x = $m + ($i % $cols) * ($w + $m); $y = $m + [math]::Floor($i / $cols) * ($h + $m)
  $cor = [System.Drawing.ColorTranslator]::FromHtml("#$hex")
  $g.FillPath((New-Object System.Drawing.SolidBrush $cor), (Arredondado $x $y $w $h 10))
  $g.DrawString("$($i + 1). $nome", $negrito, $texto, ($x + 14), ($y + 14))
  $g.DrawString("#$hex", $normal, $texto, ($x + 14), ($y + 42))
}
$bmp.Save("$PSScriptRoot\cartoes-solidos.png", [System.Drawing.Imaging.ImageFormat]::Png)
