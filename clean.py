import re

# 1. Clean directory.js
with open('./js/components/directory.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Claim Profile block
pattern = r'\$\{col\.claimStatus !== \'Claimed & Verified\' \? `\s*<button[\s\S]*?Claim Profile[\s\S]*?</button>\s*` : \'\'\}'
content = re.sub(pattern, '', content)

with open('./js/components/directory.js', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Reset claimInstitutionModal.js
with open('./js/components/claimInstitutionModal.js', 'w', encoding='utf-8') as f:
    f.write('''export function openClaimInstitutionModal() {}
export function renderClaimInstitutionModal() { return ''; }
if (typeof window !== 'undefined') {
  window.openClaimInstitutionModal = openClaimInstitutionModal;
  window.renderClaimInstitutionModal = renderClaimInstitutionModal;
}
''')

# 3. Reset institutionPortal.js
with open('./js/components/institutionPortal.js', 'w', encoding='utf-8') as f:
    f.write('''export function renderInstitutionPortal() {
  return '<div class="max-w-4xl mx-auto p-8 text-center text-slate-500 font-bold">Institution Portal has been removed.</div>';
}
if (typeof window !== 'undefined') {
  window.renderInstitutionPortal = renderInstitutionPortal;
}
''')

print("Successfully cleaned Claim Profile and Institution Portal!")
