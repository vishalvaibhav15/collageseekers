$path = ".\js\components\directory.js"
$text = [System.IO.File]::ReadAllText($path)
$pattern = "\$\{col\.claimStatus !== 'Claimed & Verified' \? `\r?\n\s*<button\r?\n\s*onclick=""event\.stopPropagation\(\); window\.openClaimInstitutionModal\('\$\{col\.id\}'\)""\r?\n\s*class=""text-\[9px\] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0\.5 rounded-md border border-amber-200 transition"">\r?\n\s*Claim Profile\r?\n\s*</button>\r?\n\s*` : ''\}"
$newText = [regex]::Replace($text, $pattern, "")
[System.IO.File]::WriteAllText($path, $newText)
Write-Host "Replaced claim button successfully"
