param()
$bundlePath = 'js/app.bundle.js'
$enc = [System.Text.Encoding]::UTF8
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $bundlePath), $enc)

$imports = @()
$exports = @()
$lineNo = 0

foreach ($line in $lines) {
    $lineNo++
    $t = $line.TrimStart()
    if ($t.StartsWith("import ")) {
        $imports += "${lineNo}: ${line}"
    }
    if ($t.StartsWith("export ")) {
        $exports += "${lineNo}: ${line}"
    }
}

Write-Host ("Total Lines: " + $lines.Length)
Write-Host ("Import lines found: " + $imports.Count)
$imports | ForEach-Object { Write-Host $_ }
Write-Host ("Export lines found: " + $exports.Count)
$exports | ForEach-Object { Write-Host $_ }
