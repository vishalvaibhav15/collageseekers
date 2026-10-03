# cdp_reel_test.ps1 - Verifies Instagram Reel video ad units via Chrome CDP

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$tempProfile = "C:\Users\Vishal\AppData\Local\Temp\cdp_prof_$([Guid]::NewGuid())"

$proc = Start-Process -FilePath $chromePath -ArgumentList "--headless=new", "--remote-debugging-port=9222", "--user-data-dir=`"$tempProfile`"", "http://localhost:5173/?v=$([Guid]::NewGuid())" -PassThru

Start-Sleep -Seconds 5

try {
    $json = Invoke-RestMethod -Uri "http://localhost:9222/json"
    $target = $json | Where-Object { $_.url -like "*localhost:5173*" } | Select-Object -First 1
    if (-not $target) { $target = $json[0] }
    $wsUrl = $target.webSocketDebuggerUrl

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $cts.CancelAfter(15000)

    $ws.ConnectAsync([Uri]$wsUrl, $cts.Token).Wait()

    # Enable Runtime and Page
    $cmds = @(
        '{"id":1,"method":"Runtime.enable"}',
        '{"id":2,"method":"Page.enable"}'
    )

    foreach ($c in $cmds) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($c)
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
    }

    Start-Sleep -Seconds 3

    # Now evaluate expressions
    $evalCmds = @(
        '{"id":10,"method":"Runtime.evaluate","params":{"expression":"document.readyState"}}',
        '{"id":11,"method":"Runtime.evaluate","params":{"expression":"typeof window.renderInstagramReelAd === \"function\" && Array.isArray(window.INSTAGRAM_REEL_ADS)"}}',
        '{"id":12,"method":"Runtime.evaluate","params":{"expression":"document.body.innerHTML.includes(\"Instagram Reel Format\")"}}'
    )

    foreach ($c in $evalCmds) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($c)
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
    }

    $buffer = New-Object byte[] 65536
    $recSegment = [ArraySegment[byte]]::new($buffer)

    for ($i = 0; $i -lt 6; $i++) {
        $result = $ws.ReceiveAsync($recSegment, $cts.Token).Result
        if ($result.Count -gt 0) {
            $msg = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count)
            if ($msg -match '"id":10|"id":11|"id":12') {
                Write-Host ">>> CDP REEL TEST RESULT <<<: $msg"
            }
        }
    }
} catch {
    Write-Host "CDP Error: $_"
} finally {
    if (-not $proc.HasExited) {
        $proc.Kill()
    }
    Remove-Item -Path $tempProfile -Recurse -Force -ErrorAction SilentlyContinue
}
