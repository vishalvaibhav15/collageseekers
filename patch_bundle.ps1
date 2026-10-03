param()
$bundlePath = 'js/app.bundle.js'
$enc = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText((Resolve-Path $bundlePath), $enc)
$lines = $content -split "`n"
$fixed = @()
foreach ($line in $lines) {
    $t = $line.TrimStart()
    if ($t.StartsWith("import '") -or $t.StartsWith('import "')) {
        continue
    }
    $fixed += $line
}
$result = $fixed -join "`n"
[System.IO.File]::WriteAllText((Resolve-Path $bundlePath), $result, $enc)
$fi = Get-Item $bundlePath
Write-Host ("Done. Bundle: " + [Math]::Round($fi.Length / 1024, 1) + " KB")
