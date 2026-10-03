$ErrorActionPreference = "Stop"

$files = @(
    "js/data/mockData.js",
    "js/store.js",
    "js/components/adsense.js",
    "js/components/sponsorEngine.js",
    "js/components/adEngine.js",
    "js/components/findPartner.js",
    "js/components/header.js",
    "js/components/hero.js",
    "js/components/directory.js",
    "js/components/studentExperience.js",
    "js/components/collegeDetail.js",
    "js/components/comparison.js",
    "js/components/calculator.js",
    "js/components/seniorConnect.js",
    "js/components/roommateFinder.js",
    "js/components/campusLiving.js",
    "js/components/manageListingsModal.js", 
    "js/components/marketplace.js",
    "js/components/scholarships.js",
    "js/components/eventsCampus.js",
    "js/components/campusMap.js",
    "js/components/movingChecklist.js",
    "js/components/claimInstitutionModal.js",
    "js/components/digitalMOUModal.js",
    "js/components/decisionAI.js",
    "js/components/aroundCampus.js",
    "js/components/dpdpConsent.js",
    "js/components/onboarding.js",
    "js/components/exploreChill.js",
    "js/components/adminPortal.js",
    "js/components/loginPage.js",
    "js/components/profileTab.js",
    "js/components/businessPortal.js",
    "js/components/seoEngine.js",
    "js/components/movies.js",
    "js/components/myCollege.js",
    "js/components/jobsCareer.js",
    "js/components/jobGiverPortal.js",
    "js/utils/dataRefresher.js",
    "js/utils/coursesGlance.js",
    "js/utils/onlineCoursesGlance.js",
    "js/app.js"
)

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("// CollegeSeekers.com - Single Production Bundle (Zero Waterfall, 0ms Load)")
[void]$sb.AppendLine("(function() {")
[void]$sb.AppendLine("'use strict';")

foreach ($relPath in $files) {
    if (-not (Test-Path $relPath)) {
        Write-Error "File not found: $relPath"
    }
    
    $content = [System.IO.File]::ReadAllText((Resolve-Path $relPath).Path, [System.Text.Encoding]::UTF8)
    
    # Pass 1: Remove named/default imports: import { X } from '...' / import X from '...'
    $clean = [System.Text.RegularExpressions.Regex]::Replace($content, "(?s)import\s+[^;]*?from\s+['""].*?['""];?\r?\n?", "")
    
    # Pass 2: Remove bare side-effect imports line-by-line: import './foo.js';
    $lines = $clean -split "`r
|
"
    $filtered = $lines | Where-Object { $_ -notmatch "^\s*import\s+['""]" }
    $clean = $filtered -join "
"
    
    # Remove export keywords
    $clean = [System.Text.RegularExpressions.Regex]::Replace($clean, "(?m)^export\s+default\s+.*$", "")
    $clean = [System.Text.RegularExpressions.Regex]::Replace($clean, "(?m)^export\s+(const|let|var|function|class|async\s+function)\s+", '$1 ')
    $clean = [System.Text.RegularExpressions.Regex]::Replace($clean, "(?s)export\s*\{[^}]*?\};?\r?\n?", "")

    [void]$sb.AppendLine("// --- START: $relPath ---")
    [void]$sb.AppendLine($clean)
    [void]$sb.AppendLine("// --- END: $relPath ---")
}

[void]$sb.AppendLine("})();")

$bundlePath = Join-Path (Get-Location) "js/app.bundle.js"
[System.IO.File]::WriteAllText($bundlePath, $sb.ToString(), [System.Text.Encoding]::UTF8)
$fi = Get-Item $bundlePath
Write-Host ("Successfully bundled " + $files.Length + " modules into " + $bundlePath + " (" + [Math]::Round($fi.Length / 1024, 1) + " KB)")
