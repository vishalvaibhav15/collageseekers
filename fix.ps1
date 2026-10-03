$replacements = @{
    ([char]0x00E2 + [char]0x201A + [char]0x00B9) = [char]0x20B9
    ([char]0x00E2 + [char]0x20AC + [char]0x2122) = [char]0x0027
    ([char]0x00E2 + [char]0x20AC + [char]0x00A2) = [char]0x2022
    ([char]0x00E2 + [char]0x20AC + [char]0x201D) = [char]0x2014
    '?T' = [char]0x0027
    '?"' = [char]0x2014
    'AEo?' = [char]0x2B50
    "dY'" = [char]::ConvertFromUtf32(0x1F4BC)
    'dYZ_' = [char]::ConvertFromUtf32(0x1F3AF)
    'dYZ%' = [char]::ConvertFromUtf32(0x1F389)
    'dY"' = [char]::ConvertFromUtf32(0x1F929)
}
$files = Get-ChildItem -Recurse -Include *.js, *.html
foreach ($f in $files) {
    if ($f.Name -match 'bundle' -or $f.Name -eq 'mockData.js') { continue }
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $modified = $false
    foreach ($key in $replacements.Keys) {
        if ($text.Contains($key)) {
            $text = $text.Replace($key, $replacements[$key])
            $modified = $true
        }
    }
    if ($modified) {
        [System.IO.File]::WriteAllText($f.FullName, $text, [System.Text.Encoding]::UTF8)
        Write-Host "Replaced text in $($f.Name)"
    }
}
