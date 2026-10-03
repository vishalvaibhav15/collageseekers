param()
$bundlePath = 'js/app.bundle.js'
$enc = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText((Resolve-Path $bundlePath), $enc)

# Write a temporary html file that loads app.bundle.js
$tempHtml = @"
<!DOCTYPE html>
<html>
<head>
  <script>
    window.onerror = function(msg, url, line, col, error) {
      console.log('EXACT ERROR LINE: ' + line + ' col: ' + col + ' msg: ' + msg);
    };
  </script>
  <script src="js/app.bundle.js"></script>
</head>
<body></body>
</html>
"@

[System.IO.File]::WriteAllText('temp_check.html', $tempHtml, $enc)

Write-Host "Checking bundle syntax via MSHTML COM engine..."
try {
    $doc = New-Object -ComObject HTMLFile
    $doc.IHTMLDocument2_write($tempHtml)
    Write-Host "COM parse completed."
} catch {
    Write-Host ("COM Exception: " + $_.Exception.Message)
}
