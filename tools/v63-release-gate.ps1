$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location $root
& python tools/package-v5-web.py
if($LASTEXITCODE -ne 0){throw 'FAILED: web package'}
$listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,0)
$listener.Start()
$port=$listener.LocalEndpoint.Port
$listener.Stop()
$origin='http://127.0.0.1:'+ $port
$started=$null
try {
 $py=(Get-Command python).Source
 $started=Start-Process -FilePath $py -ArgumentList @('-m','http.server',"$port",'--bind','127.0.0.1') -WorkingDirectory $root -PassThru
 $verified=$false
 for($i=0;$i -lt 30;$i++){
  Start-Sleep -Milliseconds 200
  try{
   $asset=Invoke-WebRequest ($origin+'/src/viewer-v4/goal-experience.js') -UseBasicParsing -TimeoutSec 2
   if($asset.StatusCode -eq 200 -and $asset.Content.Contains('cv-golden-doors')){$verified=$true;break}
  }catch{}
 }
 if(-not $verified){throw 'FAILED: private release server did not serve V6.3 goal assets'}
 $env:CAGE_E2E_BASE=$origin
 $cases=@(
  @('tests/v57-roster-194.cjs'),
  @('tests/v57-trait-families.cjs','--strict'),
  @('tests/engine-guards.cjs'),
  @('tests/random-draft.cjs'),
  @('tests/v61-ui-layout.cjs'),
  @('tests/v62-capture.cjs'),
  @('tests/v63-goal-browser.cjs'),
  @('tests/random-showdown-five.cjs'),
  @('tests/random-showdown-recovery.cjs'),
  @('tests/v60-package-parity.cjs'),
  @('tests/v56-golden-goal-pure.cjs'),
  @('tests/v57-build-contract.cjs'),
  @('tests/v57-cinematic-browser.cjs'),
  @('tests/v57-cinematic-browser.cjs','--reduced-motion'),
  @('tests/full-game-browser.cjs','--t3'),
  @('tests/full-game-browser.cjs','--t3','--traits-preview'),
  @('tests/v57-old-version-recovery.cjs'),
  @('tests/v57-classic-save-notice.cjs'),
  @('tests/v57-archived-classic.cjs'),
  @('tests/v54-classic-parity.cjs'),
  @('tests/v54-classic-compat-fuzz.cjs'),
  @('tests/viewer/run-all.cjs'),
  @('tests/viewer-v4/replay.test.cjs')
 )
 $n=0
 foreach($case in $cases){
  Write-Output ('GATE '+($n+1)+'/'+$cases.Count+': '+($case -join ' '))
  & node @case
  if($LASTEXITCODE -ne 0){throw 'FAILED: '+($case -join ' ')}
  $n++
 }
 & node tools/build-t3.cjs --check
 if($LASTEXITCODE -ne 0){throw 'FAILED: T3 reproducible build'}
 Write-Output ('V63_CINEMATIC_RELEASE_GATE_PASS '+$n+' automated cases + build-t3 --check')
}
finally {if($started){Stop-Process -Id $started.Id -Force -ErrorAction SilentlyContinue}}
