$path = ".\js\components\directory.js"
$lines = Get-Content $path
$filtered = $lines | Where-Object { 
    $_ -notmatch "openClaimInstitutionModal" -and 
    $_ -notmatch "Claim Profile" -and 
    $_ -notmatch "claimStatus"
}
$filtered | Set-Content $path
Write-Host "Filtered claim lines successfully."
