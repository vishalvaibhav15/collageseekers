$path = ".\js\components\directory.js"
$lines = Get-Content $path
$newLines = $lines[0..859] + $lines[865..($lines.Length-1)]
$newLines | Set-Content $path
Write-Host "Sliced lines 861-865 successfully."
