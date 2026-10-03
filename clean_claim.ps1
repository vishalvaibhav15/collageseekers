$path = ".\js\components\directory.js"
$content = [System.IO.File]::ReadAllText($path)
$newContent = $content.Replace("                                 ${col.claimStatus !== 'Claimed & Verified' ? ``n                                   <button `n                                     onclick=""event.stopPropagation(); window.openClaimInstitutionModal('${col.id}')"" `n                                     class=""text-[9px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition"">`n                                     Claim Profile`n                                   </button>`n                                 ` : ''}", "")

# If exact match fails, do regex match
if ($newContent -eq $content) {
    $regex = '(?s)\$\{col\.claimStatus !== ''Claimed & Verified'' \? `.*?Claim Profile.*?` : ''\}'
    $newContent = $content -replace $regex, ''
}

[System.IO.File]::WriteAllText($path, $newContent)

# 2. Reset claimInstitutionModal.js safely
$claimModalPath = ".\js\components\claimInstitutionModal.js"
$claimModalCode = "export function openClaimInstitutionModal() {}`nexport function renderClaimInstitutionModal() { return ''; }`nif (typeof window !== 'undefined') { window.openClaimInstitutionModal = openClaimInstitutionModal; window.renderClaimInstitutionModal = renderClaimInstitutionModal; }`n"
[System.IO.File]::WriteAllText($claimModalPath, $claimModalCode)

# 3. Reset institutionPortal.js safely
$instPortalPath = ".\js\components\institutionPortal.js"
$instPortalCode = "export function renderInstitutionPortal() { return '<div class=""max-w-4xl mx-auto p-8 text-center text-slate-500 font-bold"">Institution Portal has been removed.</div>'; }`nif (typeof window !== 'undefined') { window.renderInstitutionPortal = renderInstitutionPortal; }`n"
[System.IO.File]::WriteAllText($instPortalPath, $instPortalCode)

Write-Host "Cleaned claim profile and institution portal successfully."
