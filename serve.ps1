# CollegeSeekers.com - High Performance Asynchronous In-Memory Static Web Server
param(
    [int]$Port = 8080
)

$baseDir = $PSScriptRoot
if (-not $baseDir) {
    $baseDir = (Get-Location).Path
}

$csPath = Join-Path $baseDir 'Server.cs'
$dllPath = Join-Path $baseDir 'CollegeSeekers.Server.dll'

# Recompile if DLL missing or Server.cs is newer
$needsCompile = $false
if (-not (Test-Path $dllPath)) {
    $needsCompile = $true
} elseif ((Get-Item $csPath).LastWriteTimeUtc -gt (Get-Item $dllPath).LastWriteTimeUtc) {
    Remove-Item $dllPath -Force -ErrorAction SilentlyContinue
    $needsCompile = $true
}

if (-not ([System.Management.Automation.PSTypeName]'CollegeSeekers.StaticServer').Type) {
    if ($needsCompile) {
        Add-Type -Path $csPath -OutputAssembly $dllPath
    }
    Add-Type -Path $dllPath
}

$server = New-Object CollegeSeekers.StaticServer($baseDir)

# Detect local network IPs
$localIps = @()
try {
    $localIps = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254*' }).IPAddress
} catch {}

try {
    $server.Start($Port)
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host '  🎓 CollegeSeekers.com Web Application Server Running!' -ForegroundColor Green
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host "  👉 Inside (Localhost):   http://localhost:$Port/ or http://127.0.0.1:$Port/" -ForegroundColor Yellow
    foreach ($ip in $localIps) {
        Write-Host "  👉 Outside (Network/LAN): http://$($ip):$Port/" -ForegroundColor Cyan
    }
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host "High-speed in-memory multi-threaded engine active (0.0.0.0 dual-stack).`n"
    Write-Host "Press Ctrl+C to stop the server.`n"

    while ($true) {
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Error "Server runtime error: $_"
}
finally {
    if ($server) {
        $server.Stop()
    }
    Write-Host "Server successfully stopped." -ForegroundColor Yellow
}
