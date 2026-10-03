param()
$enc = [System.Text.Encoding]::UTF8
$bundlePath = 'js/app.bundle.js'
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $bundlePath), $enc)
$bad = @()
foreach ($line in $lines) {
    $t = $line.TrimStart()
    if ($t.StartsWith("import '") -or $t.StartsWith('import "')) {
        $bad += $line
    }
}
if ($bad.Count -eq 0) {
    Write-Host "OK: No bare import lines in bundle"
} else {
    Write-Host ("FOUND " + $bad.Count + " bare imports:")
    $bad | ForEach-Object { Write-Host $_ }
}
