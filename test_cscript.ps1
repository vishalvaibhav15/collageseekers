param()
Add-Type -AssemblyName System.Web.Extensions
$bundlePath = 'js/app.bundle.js'
$enc = [System.Text.Encoding]::UTF8
$code = [System.IO.File]::ReadAllText((Resolve-Path $bundlePath), $enc)

$serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$serializer.MaxJsonLength = [int]::MaxValue
$jsonCode = $serializer.Serialize($code)

$scriptFile = 'temp_check.js'
[System.IO.File]::WriteAllText($scriptFile, "try { eval(" + $jsonCode + "); WScript.Echo('SYNTAX OK'); } catch(e) { WScript.Echo('SYNTAX ERROR: ' + e.name + ': ' + e.message); }", $enc)

$result = & cscript.exe //Nologo temp_check.js 2>&1
Write-Host ($result -join "`n")
