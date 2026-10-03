param()
$bundlePath = 'js/app.bundle.js'
$enc = [System.Text.Encoding]::UTF8
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $bundlePath), $enc)

$lineNo = 0
$issues = @()

foreach ($line in $lines) {
    $lineNo++
    $t = $line.TrimStart()
    # Check for bare variable declarations without keyword, e.g. "SECTION_SPONSORS ="
    if ($t -match "^[a-zA-Z0-9_]+\s*=" -and $t -notmatch "^(const|let|var|window\.|this\.|self\.|store\.|mockData\.|if|for|while|return|case|switch)") {
        $issues += "${lineNo}: ${line}"
    }
    # Check for unexpected standalone identifier 's' or similar
    if ($t -match "^s\b") {
        $issues += "STANDALONE S ${lineNo}: ${line}"
    }
}

Write-Host ("Potential issues found: " + $issues.Count)
$issues | Select-Object -First 30 | ForEach-Object { Write-Host $_ }
