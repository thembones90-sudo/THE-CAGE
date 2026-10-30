$ErrorActionPreference = 'Stop'
$root = 'A:\THE CAGE'
$files = @(
 'src\tactics\traits.js','src\cage-engine.js','src\roster-100.js','src\roster-pl-134.js',
 'proposals\traits\big-pickle\trait-hooks.js','proposals\traits\big-pickle\REPORT.md',
 'proposals\traits\CLAUDE_TRAIT_SPEC.md',
 'BIG_PICKLE_TRAIT_TASK.md','CLAUDE_BIG_PICKLE_TRAIT_BRIEF.md'
)
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($rel in $files) {
 $path = Join-Path $root $rel
 if (!(Test-Path -LiteralPath $path)) { throw "Not found: $path" }
 $old = [System.IO.File]::ReadAllText($path)
 $new = [regex]::Replace($old, '\bHunter\b', 'Tracker')
 if ($old -ne $new) {
  [System.IO.File]::WriteAllText($path,$new,$utf8)
  Write-Output ("Updated " + $rel + " occurrences=" + ([regex]::Matches($old,'\bHunter\b').Count))
 }
}
