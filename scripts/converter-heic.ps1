param([string]$Origem, [string]$Destino)

Add-Type -AssemblyName PresentationCore
New-Item -ItemType Directory -Force $Destino | Out-Null

$arquivos = Get-ChildItem -LiteralPath $Origem -File | Sort-Object Name
$n = 0
$mapa = @()

foreach ($a in $arquivos) {
  $n++
  $nome = '{0:D2}.jpg' -f $n
  $saida = Join-Path $Destino $nome
  try {
    $entrada = [IO.File]::OpenRead($a.FullName)
    $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
      $entrada,
      [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
      [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
    $quadro = $dec.Frames[0]
    $maior = [Math]::Max($quadro.PixelWidth, $quadro.PixelHeight)
    $escala = [Math]::Min(1.0, 2400.0 / $maior)
    $t = New-Object System.Windows.Media.ScaleTransform($escala, $escala)
    $menor = New-Object System.Windows.Media.Imaging.TransformedBitmap($quadro, $t)
    $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
    $enc.QualityLevel = 92
    $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($menor))
    $fs = [IO.File]::Create($saida)
    $enc.Save($fs)
    $fs.Close()
    $entrada.Close()
    $mapa += "$nome`t$($a.Name)`t$($menor.PixelWidth)x$($menor.PixelHeight)"
  } catch {
    $mapa += "$nome`t$($a.Name)`tERRO: $($_.Exception.Message)"
  }
}

$mapa | Set-Content -Encoding utf8 (Join-Path $Destino 'mapa.txt')
"Convertidas: $n"
($mapa | Where-Object { $_ -match 'ERRO' }) -join "`n"
