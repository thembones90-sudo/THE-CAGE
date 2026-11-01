$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location $root
$server=$null
try{
 try{$resp=Invoke-WebRequest 'http://127.0.0.1:51918/draft.html' -UseBasicParsing -TimeoutSec 3;if($resp.StatusCode -ne 200){throw 'Invalid localhost server'}}
 catch{$server=Start-Process -FilePath (Get-Command python).Source -ArgumentList @('-m','http.server','51918','--bind','127.0.0.1') -WorkingDirectory $root -PassThru;Start-Sleep -Seconds 2}
 $env:CAGE_E2E_BASE='http://127.0.0.1:51918'
 $tests=@(
  @('tests/v66-gk-roster.cjs'),
  @('tests/v66-gk-rules.cjs'),
  @('tests/v66-keeper-draft.cjs'),
  @('tests/v66-engine-gk.cjs'),
  @('tests/v66-gk-dynamics.cjs'),
  @('tests/v67-sweep-exposure.cjs'),
  @('tests/v68-gk50-history.cjs'),
  @('tests/v69-golden-kickoff.cjs'),
  @('tests/t312-creative-link.cjs'),
  @('tests/v66-golden-pressure.cjs'),
  @('tests/v66-gk-browser.cjs'),
  @('tests/v66-gk-five.cjs'),
  @('tests/v66-gk-restore.cjs'),
  @('tests/v66-gk-discard.cjs'),
  @('tests/v66-view-timing.cjs'),
  @('tests/v65-war-room.cjs'),
  @('tests/v64-cpu-unit.cjs'),
  @('tests/v64-cpu-browser.cjs'),
  @('tests/v64-cpu-five.cjs'),
  @('tests/v64-legacy-hotseat.cjs'),
  @('tests/v57-cinematic-browser.cjs','--reduced-motion'),
  @('tests/v54-classic-parity.cjs'),
  @('tests/viewer/run-all.cjs'),
  @('tests/v64-locomotion.cjs'),
  @('tests/t3-13-telemetry.cjs'),
  @('tests/t3-13-gk-style.cjs'),
  @('tests/t3-13-pressure.cjs'),
  @('tests/m1-movement.cjs'),
  @('tests/elite-67-approved-ovr.cjs'),
  @('tests/overall-v2.cjs'),
  @('tests/overall-184.cjs'),
  @('tests/overall-alex-calibration.cjs'),
  @('tests/overall-match-invariance.cjs'),
  @('tests/owner-tier-revisions-v17.cjs'),
  @('tests/roster-184-deportivo-legends.cjs'),
  @('tests/valeron-reassessment.cjs'),
  @('tests/di-canio-recruitment.cjs'),
  @('tests/v69-preflight.cjs'),
  @('tests/v60-package-parity.cjs')
 )
 $passed=0
 foreach($case in $tests){Write-Output ('RUN '+($passed+1)+'/'+$tests.Count+' '+($case -join ' '));& node @case;if($LASTEXITCODE -ne 0){throw ('FAILED '+($case -join ' '))};$passed++}
 node tools/build-t3.cjs --check
 if($LASTEXITCODE -ne 0){throw 'T3 build unreproducible'}
 Write-Output ('V66_EXPERIMENTAL_GATE_PASS '+$passed+' suites + reproducible T3-13')
}finally{if($server){Stop-Process $server.Id -Force -ErrorAction SilentlyContinue}}
