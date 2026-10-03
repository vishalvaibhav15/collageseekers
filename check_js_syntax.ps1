param()
Add-Type -AssemblyName "Microsoft.JScript, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a" -ErrorAction SilentlyContinue

$bundlePath = 'js/app.bundle.js'
$enc = [System.Text.Encoding]::UTF8
$code = [System.IO.File]::ReadAllText((Resolve-Path $bundlePath), $enc)

Write-Host ("Checking syntax of " + $bundlePath + " (" + $code.Length + " bytes)...")

# Try .NET JSParser if available
try {
    $src = [Microsoft.JScript.Context]::new([Microsoft.JScript.DocumentContext]::new([Microsoft.JScript.VirtualFile]:new("app.bundle.js"), $code))
    $parser = [Microsoft.JScript.JSParser]::new($src)
    $ast = $parser.Parse()
    Write-Host "SUCCESS: .NET JSParser parsed bundle without syntax errors!"
} catch {
    Write-Host ("JSParser Exception: " + $_.Exception.Message)
}
