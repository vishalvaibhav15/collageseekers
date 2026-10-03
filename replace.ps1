$text = [IO.File]::ReadAllText("js\components\directory.js")

$search = 'NIRF #${col.nirfRank}
                            </span>
                          ` : ''}'

$replace = 'NIRF #${col.nirfRank}
                            </span>
                          ` : ''}
                          ${!isSchool ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white backdrop-blur-sm shadow-xs border border-emerald-400 gap-1" title="Govt Fraud Shield Verified">
                              <i data-lucide="shield-check" class="w-3 h-3 text-white"></i>
                              ${col.naacGrade ? ''NAAC '' + col.naacGrade : (col.approvals ? col.approvals[0] : ''UGC / AICTE'')}
                            </span>
                          ` : ''}'

$text = $text.Replace($search, $replace)
[IO.File]::WriteAllText("js\components\directory.js", $text)
